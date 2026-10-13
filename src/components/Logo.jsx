import { Boxes } from 'lucide-react'
export default function Logo({compact=false,light=false}) {
 return <span className={'ikai-logo'+(light?' logo-light':'')}><span className="ikai-logo-mark"><Boxes size={19}/></span>{!compact&&<span className="ikai-logo-type">ikai<span>.</span>one</span>}</span>
}