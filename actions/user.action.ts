"use server"

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache";

export async function syncUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return;

    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (existingUser) return existingUser;

    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        username: user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      },
    });

    return dbUser;
  } catch (error) {
    console.log("Error in syncUser", error);
  }
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: {
      clerkId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    },
  });
}

export async function getDbUserId() { //Id del usuario viene de la db y no desde clerk
  const {userId: clerkId}= await auth()
  if(!clerkId) return null;
    
    const user = await getUserByClerkId(clerkId)
    if(!user) throw new Error("Usuario no encontrado")

    return user.id
}

export async function getRandomUsers(){
  try {
    const userId = await getDbUserId()
    
    if (!userId) return [];
    const randomUsers = await prisma.user.findMany({
      where:{
        AND: [
          {NOT: {id: userId}},  /* Obtenemos 3 usuarios random excluyendonos y a los que ya segumos */
          {NOT: {followers: {some: {followerId: userId}}}}
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count:{
          select:{
            followers:true,
          }
        }
      },
      take: 3,
    })
    return randomUsers
  } catch (error) {
      console.log("Error obteniendo usuarios aleatorios: ", error)
  }
}

export async function toggleFollow(targetUserId: string){
  try {
    const userId = await getDbUserId()
    if (!userId) return; 
    if(userId === targetUserId) throw new Error("No podes seguirte a vos mismo")

      const existingFollow = await prisma.follows.findUnique({
        where:{
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          }
        }
      })
    if(existingFollow){ //dejar de seguir
      await prisma.follows.delete({
        where:{
          followerId_followingId:{
            followerId: userId,
            followingId: targetUserId
          }
        }
      
      })
    } else { //seguir si no lo seguiamos
        await prisma.$transaction([
          prisma.follows.create({
            data:{
              followerId: userId,
              followingId: targetUserId
            }
          }),
          prisma.notification.create({
            data: {
              type: "FOLLOW",
              userId: targetUserId, //usuario siendo seguido
              creatorId: userId, //usuario que sigue al otro
            }
          })
        ])
    }
      revalidatePath("/")
      return {success: true}
  } catch (error) {
      console.log("Error al alternar seguimiento", error)
      return {success: true, error: "Error al alternar seguimiento"}

  }
}