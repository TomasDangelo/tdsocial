import Link from 'next/link'

export default function NotFound(){
    return(
        <div>
            <h2>No encontrado</h2>
            <p>No pudimos encontrar el recurso solicitado</p>
            <Link href="/">Volver a inicio</Link>
        </div>
    )
}