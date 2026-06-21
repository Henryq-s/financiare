import { redirect } from 'next/navigation'

// Gate page no longer used — lead capture is now inline on /resultado
export default function GatePage() {
  redirect('/simulacao')
}
