'use client'

import {useState} from 'react'
import { Button } from './ui/button'
import toast from 'react-hot-toast'
import { toggleFollow } from '@/actions/user.action'
import { Loader2Icon } from 'lucide-react'

function FollowButton({userId} : {userId: string}) {
    const [isLoading, setIsLoading] = useState(false)

    const handleFollow = async() => {
        setIsLoading(true)

        try {
          await toggleFollow(userId)
          toast.success("Siguiendo al usuario correctamente")
        } catch (error) {
          console.log("Error al seguir usuario", error)
          toast.error("Error al seguir usuario")
        }
        finally{
          setIsLoading(false)
        }
    }
  return (
    <Button size={"sm"} variant={"secondary"} onClick={handleFollow} disabled={isLoading} className='w-20'>
      {isLoading? <Loader2Icon className="size-4 animate-spin"/> : "Seguir"}
    </Button>
  
)
}

export default FollowButton
