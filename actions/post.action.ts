'use server'

import { revalidatePath } from "next/cache";
import { getDbUserId } from "./user.action"
import prisma from "@/lib/prisma";

export async function createPost(content: string){
    try {
        const userId = await getDbUserId();
        if (!userId) return;
        const post = await prisma.post.create({
            data:{
                content,
                authorId: userId
            }
        })
        revalidatePath("/")
        return {success: true, post}
    } catch (error) {
        console.error("Error al crear la publicación", error)
        return {success: false, error: "Error al crear la publicación"}
    }
}


export async function getPosts() {
    try {
        const posts = await prisma.post.findMany({
            orderBy: {
                createdAt: "desc"
            },
            include:{
                author:{
                    select:{
                        id: true,
                        name: true,
                        image: true,
                        username: true,
                    }
                },
                comments:{
                    include:{
                        author:{
                            select:{
                                id: true,
                                username: true,
                                image:true,
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "asc"
                    }
                },
                 likes: {
                    include: {
                      user: {
                        select: { id: true, username: true, name: true, image: true }
                      }
                    }
                 },
                _count:{
                    select:{
                        likes: true,
                        comments:true,
                    }
                }
            }
        })
        return posts;
    } catch (error) {
        console.log("Error en getPosts:", error)
        throw new Error("Error en getPosts")
    }
}

export async function toggleLike(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return;

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post not found");

    if (existingLike) {
      // sacar like si ya existe
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } else {
      // si no existe, da like y crea notificación
      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            postId,
          },
        }),
        ...(post.authorId !== userId? [  //la crea solo si no es nuestro propio post
              prisma.notification.create({
                data: {
                  type: "LIKE",
                  userId: post.authorId, // receptor (autor del post)
                  creatorId: userId, // persona que dio like
                  postId,
                },
              }),
            ]
          : []),
      ]);
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al alternar like:", error);
    return { success: false, error: "Error al alternar like" };
  }
}

export async function createComment(postId: string, content: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;
    if (!content) throw new Error("El contenido es necesario para comentar");

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post no encontrado");

    // Crear el comentario y la notificacion en una transaction de prisma
    const [comment] = await prisma.$transaction(async (tx) => {
      // Primero, crearmos el comentario
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
        },
      });


      if (post.authorId !== userId) {
        await tx.notification.create({       // La creamos solo en posts de alguien mas 
          data: {
            type: "COMMENT",
            userId: post.authorId,
            creatorId: userId,
            postId,
            commentId: newComment.id,
          },
        });
      }

      return [newComment];
    });

    revalidatePath(`/`);
    return { success: true, comment };
  } catch (error) {
    console.error("Error al crear comentario", error);
    return { success: false, error: "Error al crear comentario" };
  }
}

export async function deletePost(postId: string) {
  try {
    const userId = await getDbUserId();

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error("Post no encontrado");
    if (post.authorId !== userId) throw new Error("No autorizado, no tenes permiso para eliminar");

    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath("/"); // purgamos la cache de home
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar post", error);
    return { success: false, error: "Error al eliminar post" };
  }
}

export async function deleteComment(commentId: string) {
  const userId  = await getDbUserId();
  if (!userId) return { success: false, error: "No autorizado" };

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.authorId !== userId) return { success: false, error: "No autorizado" };

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath("/");
  return { success: true };
}