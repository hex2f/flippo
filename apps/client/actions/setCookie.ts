'use server'
import { cookies } from 'next/headers'

export default async function setCookie(formData: FormData) {
	if (!formData.has('key') && !formData.has('value')) return
	cookies().set(formData.get('key') as string, formData.get('value') as string)
}