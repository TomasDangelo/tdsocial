'use client'

import { useUser } from "@clerk/nextjs"
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Loader2Icon, SendIcon } from "lucide-react";
import { createPost } from "../actions/post.action";
import toast from "react-hot-toast";


function CreatePost() {
    const {user} = useUser()
    const [content, setContent] = useState("");
    const [isPosting, setisPosting] = useState(false);

    const handleSubmit = async() => {
        if(!content.trim()) return;
        setisPosting(true)
        try {
           const result = await createPost(content);
            if(result?.success){
                setContent("")
            }
            toast.success("Publicación creada correctamente") 
        } catch (error) {
              console.error("Error al crear post: " , error)
              toast.error("Error al crear el post")
          }
          finally{
            setisPosting(false)
          }
    }
  return (
    <Card className="mb-6">
      <CardContent>
        <div className="flex align-center flex-col gap-6">
            <div className="flex gap-4">
            <Avatar className="mt-2">
                <AvatarImage src={user?.imageUrl || "/avatar.png"}/>
            </Avatar>
            <Textarea placeholder="¿Qué estás pensando?" className="min-h-[100px]  resize-none border-none focus-visible:ring-0 p-2 text-base"
            value={content} onChange={(e)=> setContent(e.target.value)} disabled={isPosting}/>
            </div>

          <div className="flex items-center justify-between border-t pt-4">
            <Button className="flex items-center" onClick={handleSubmit} disabled={(!content.trim()) || isPosting}>
              {isPosting ? (
                <>
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                  Publicando...
                </>
              ) : (
                <>
                  <SendIcon className="size-4 mr-2" />
                  Publicar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CreatePost
