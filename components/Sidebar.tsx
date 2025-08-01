import { currentUser } from '@clerk/nextjs/server'
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { Button } from './ui/button';
import { getUserByClerkId } from '@/actions/user.action';
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { LinkIcon, MapPinIcon } from "lucide-react";

async function Sidebar() {
    const authUser = await currentUser();
    if(!authUser) return <UnauthenticatedUserSideBar />

    const user = await getUserByClerkId(authUser.id)
    if (!user) return null;
    return (
    <div className="sticky top-20">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <Link href={`/profile/${user.username}`} className="flex flex-col items-center justify-center">
              <Avatar className="w-20 h-20 border-2 ">
                <AvatarImage src={user.image || "/avatar.png"} />
              </Avatar>

              <div className="mt-4 space-y-1">
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.username}</p>
              </div>
            </Link>

            {user.bio && <p className="mt-3 text-sm text-muted-foreground">{user.bio}</p>}

            <div className="w-full">
              <Separator className="my-4" />
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">{user._count.following}</p>
                  <p className="text-xs text-muted-foreground">Siguiendo</p>
                </div>
                <Separator orientation="vertical" />
                <div>
                  <p className="font-medium">{user._count.followers}</p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </div>
              </div>
              <Separator className="my-4" />
            </div>

            <div className="w-full space-y-2 text-sm">
              <div className="flex items-center text-muted-foreground">
                <MapPinIcon className="w-4 h-4 mr-2" />
                {user.location || "Sin ubicación"}
              </div>
              <div className="flex items-center text-muted-foreground">
                <LinkIcon className="w-4 h-4 mr-2 shrink-0" />
                {user.website ? (
                  <a href={`${user.website}`} className="hover:underline truncate" target="_blank">
                    {user.website}
                  </a>
                ) : (
                  "Sin sitio web"
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Sidebar

const UnauthenticatedUserSideBar = () => (
    <div className='sticky top-20'>
        <Card>
            <CardHeader>
                <CardTitle className='text-center'>Bienvenido nuevamente!</CardTitle>
            </CardHeader>
            <CardContent>
            <p className='text-center font-semibold mb-4'>Ingresa para acceder a tu perfil y conectar con otras personas. </p>
            <SignInButton>
                <Button className='w-full' variant="outline">
                    Ingresar
                </Button>
            </SignInButton>
            <SignUpButton>
                <Button className='w-full mt-2' variant="default">
                    Registrarse
                </Button>
            </SignUpButton>
            </CardContent>
        
        </Card>
    </div>
)
