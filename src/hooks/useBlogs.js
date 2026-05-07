import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, onSnapshot, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase'

const COL = 'blogs'

function normaliseDate(raw) {
  if (!raw) return new Date().toISOString()
  if (raw instanceof Timestamp) return raw.toDate().toISOString()
  if (raw instanceof Date) return raw.toISOString()
  return String(raw)
}

export function useBlogs() {
  const [blogs, setBlogs] = useState([])
  const [blogsLoading, setBlogsLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, COL), orderBy('date', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setBlogs(snap.docs.map(d => {
        const data = d.data()
        return { id: d.id, ...data, date: normaliseDate(data.date) }
      }))
      setBlogsLoading(false)
    })
    return unsub
  }, [])

  const publish = ({ title, content }) =>
    addDoc(collection(db, COL), {
      title: title.trim(),
      content: content.trim(),
      date: serverTimestamp(),
    })

  const update = (id, { title, content }) =>
    updateDoc(doc(db, COL, id), { title: title.trim(), content: content.trim() })

  const remove = (id) => deleteDoc(doc(db, COL, id))

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(blogs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: 'my-posts.json' }).click()
    URL.revokeObjectURL(url)
  }

  const importFile = (file) =>
    new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result)
          if (!Array.isArray(data)) throw new Error()
          let count = 0
          for (const post of data) {
            if (post.title && post.content) {
              await addDoc(collection(db, COL), {
                title: post.title,
                content: post.content,
                date: post.date ? new Date(post.date) : serverTimestamp(),
              })
              count++
            }
          }
          res(count)
        } catch { rej(new Error('Invalid file')) }
      }
      reader.readAsText(file)
    })

  return { blogs, blogsLoading, publish, update, remove, exportAll, importFile }
}
