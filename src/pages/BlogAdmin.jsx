import { useState, useRef, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import ImageExt from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { collection, getCountFromServer, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import styles from './BlogAdmin.module.css'

const DRAFT_KEY = 'blog_draft'

function useStats() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    async function load() {
      const [userCount, recentSnap] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getDocs(query(collection(db, 'users'), orderBy('lastSeen', 'desc'), limit(5))),
      ])
      setStats({ totalUsers: userCount.data().count, recent: recentSnap.docs.map(d => d.data()) })
    }
    load().catch(() => {})
  }, [])
  return stats
}

export default function BlogAdmin({ blogs, onPublish, onUpdate, onDelete, onBack, onExport, onImport, auth }) {
  const { user, loading, isAdmin, signIn, logOut } = auth

  if (loading) return <LoadingScreen onBack={onBack} />
  if (!user) return <SignInScreen onBack={onBack} onSignIn={signIn} />
  if (!isAdmin) return <DeniedScreen onBack={onBack} user={user} onSignOut={logOut} />

  return <AdminPanel
    blogs={blogs} onPublish={onPublish} onUpdate={onUpdate} onDelete={onDelete}
    onExport={onExport} onImport={onImport} onBack={onBack} user={user} onSignOut={logOut}
  />
}

/* ── Auth screens ── */
function LoadingScreen({ onBack }) {
  return (
    <div className={styles.page}>
      <SimpleHeader onBack={onBack} title="Blog Admin" />
      <div className={styles.authCenter}><div className={styles.spinner} /></div>
    </div>
  )
}

function SignInScreen({ onBack, onSignIn }) {
  return (
    <div className={styles.page}>
      <SimpleHeader onBack={onBack} title="Blog Admin" />
      <div className={styles.authCenter}>
        <div className={styles.authCard}>
          <div className={styles.authIcon}>🔐</div>
          <h2 className={styles.authTitle}>Admin Sign In</h2>
          <p className={styles.authDesc}>Sign in with your Google account to write and manage posts.</p>
          <button className={styles.googleBtn} onClick={onSignIn}><GoogleIcon /> Sign in with Google</button>
        </div>
      </div>
    </div>
  )
}

function DeniedScreen({ onBack, user, onSignOut }) {
  return (
    <div className={styles.page}>
      <SimpleHeader onBack={onBack} title="Blog Admin" />
      <div className={styles.authCenter}>
        <div className={styles.authCard}>
          <div className={styles.authIcon}>⛔</div>
          <h2 className={styles.authTitle}>Access Denied</h2>
          <p className={styles.authDesc}><strong>{user.email}</strong> is not an admin account.</p>
          <button className={styles.googleBtn} onClick={onSignOut}>Sign out &amp; try another account</button>
        </div>
      </div>
    </div>
  )
}

function SimpleHeader({ onBack, title, right }) {
  return (
    <div className={styles.header}>
      <button className={styles.backBtn} onClick={onBack}>← Back</button>
      <span className={styles.headerTitle}>{title}</span>
      {right || <div style={{ width: 60 }} />}
    </div>
  )
}

/* ── Admin panel ── */
function AdminPanel({ blogs, onPublish, onUpdate, onDelete, onExport, onImport, onBack, user, onSignOut }) {
  const [view, setView] = useState('list')
  const [editPost, setEditPost] = useState(null)
  const stats = useStats()
  const fileRef = useRef()
  const [importMsg, setImportMsg] = useState('')

  const openNew = () => { setEditPost(null); setView('write') }
  const openEdit = (post) => { setEditPost(post); setView('write') }

  const handleImport = async (e) => {
    const file = e.target.files[0]; if (!file) return; e.target.value = ''
    try { const n = await onImport(file); setImportMsg(`Imported ${n} post${n !== 1 ? 's' : ''}.`) }
    catch { setImportMsg('Import failed — check the file format.') }
    setTimeout(() => setImportMsg(''), 4000)
  }

  if (view === 'write') {
    return <BlogEditor
      post={editPost}
      onSave={async (data) => {
        if (editPost) await onUpdate(editPost.id, data)
        else await onPublish(data)
        setView('list')
      }}
      onBack={() => setView('list')}
      user={user}
    />
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <span className={styles.headerTitle}>My Posts</span>
        <button className={styles.newBtn} onClick={openNew}>+ New</button>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{stats ? stats.totalUsers : '—'}</div>
          <div className={styles.statLabel}>Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNum}>{blogs.length}</div>
          <div className={styles.statLabel}>Posts</div>
        </div>
      </div>

      {stats?.recent?.length > 0 && (
        <div className={styles.recentUsers}>
          <div className={styles.recentUsersLabel}>Recently active</div>
          {stats.recent.map((u, i) => (
            <div key={i} className={styles.recentUserRow}>
              {u.photoURL ? <img src={u.photoURL} alt="" className={styles.recentAvatar} /> : <div className={styles.recentAvatarFallback}>{u.email?.[0]?.toUpperCase()}</div>}
              <div className={styles.recentUserInfo}>
                <div className={styles.recentUserName}>{u.displayName || u.email}</div>
                <div className={styles.recentUserEmail}>{u.displayName ? u.email : ''}</div>
              </div>
              {u.lastSeen?.toDate && <div className={styles.recentUserTime}>{u.lastSeen.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</div>}
            </div>
          ))}
        </div>
      )}

      {/* User bar */}
      <div className={styles.userBar}>
        {user.photoURL && <img src={user.photoURL} alt="" className={styles.userAvatar} />}
        <span className={styles.userEmail}>{user.email}</span>
        <button className={styles.signOutBtn} onClick={onSignOut}>Sign out</button>
      </div>

      {/* Post list */}
      <div className={styles.listArea}>
        {blogs.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✍️</div>
            <p className={styles.emptyTitle}>No posts yet</p>
            <p className={styles.emptyHint}>Tap <strong>+ New</strong> to write your first post.</p>
          </div>
        ) : blogs.map(post => (
          <div key={post.id} className={styles.postRow}>
            {post.coverImage && <img src={post.coverImage} alt="" className={styles.postThumb} onError={e => e.target.style.display='none'} />}
            <div className={styles.postMain}>
              <div className={styles.postTitle}>{post.title}</div>
              <div className={styles.postDate}>{new Date(post.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <div className={styles.postActions}>
              <button className={styles.editBtn} onClick={() => openEdit(post)}>Edit</button>
              <button className={styles.deleteBtn} onClick={() => { if (window.confirm(`Delete "${post.title}"?`)) onDelete(post.id) }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.adminFooter}>
        <p className={styles.adminFooterLabel}>Migrate old posts</p>
        <div className={styles.adminFooterBtns}>
          <button className={styles.footerBtn} onClick={onExport}>Export All</button>
          <button className={styles.footerBtn} onClick={() => fileRef.current?.click()}>Import File</button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </div>
        {importMsg && <p className={styles.importMsg}>{importMsg}</p>}
      </div>
    </div>
  )
}

/* ── Rich Blog Editor ── */
function BlogEditor({ post, onSave, onBack, user }) {
  const [title, setTitle] = useState(post?.title || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [uploading, setUploading] = useState(false)
  const imgInputRef = useRef()

  // Load draft from localStorage if new post
  const draftContent = !post ? (localStorage.getItem(DRAFT_KEY + '_content') || '') : ''
  const draftTitle  = !post ? (localStorage.getItem(DRAFT_KEY + '_title')   || '') : ''

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ImageExt.configure({ inline: false }),
      Placeholder.configure({ placeholder: 'Write your post here…\n\nTip: Use the toolbar to add headings, bold text, or insert images.' }),
    ],
    content: post?.content || draftContent,
    onUpdate: ({ editor }) => {
      if (!post) localStorage.setItem(DRAFT_KEY + '_content', editor.getHTML())
    },
  })

  // Auto-save title draft
  useEffect(() => {
    if (!post) localStorage.setItem(DRAFT_KEY + '_title', title)
  }, [title, post])

  useEffect(() => {
    if (!post && draftTitle) setTitle(draftTitle)
  }, [])

  const handleSave = async () => {
    if (!title.trim()) { setError('Please add a title.'); return }
    if (!editor || editor.isEmpty) { setError('Please write some content.'); return }
    setError(''); setSaving(true)
    try {
      await onSave({ title, content: editor.getHTML() })
      if (!post) {
        localStorage.removeItem(DRAFT_KEY + '_content')
        localStorage.removeItem(DRAFT_KEY + '_title')
      }
      setDone(true)
    } catch (e) {
      console.error('Firestore error:', e)
      const msg = e?.code ? `Firebase error: ${e.code}` : (e?.message || 'Unknown error')
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const uploadImage = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const storageRef = ref(storage, `blog-images/${Date.now()}-${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      editor?.chain().focus().setImage({ src: url }).run()
    } catch (e) {
      setError('Image upload failed. Make sure Firebase Storage is enabled.')
    } finally {
      setUploading(false)
    }
  }

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.authCenter}>
          <div className={styles.authCard}>
            <div className={styles.authIcon}>✅</div>
            <h2 className={styles.authTitle}>{post ? 'Updated!' : 'Published!'}</h2>
            <p className={styles.authDesc}>Your post is now live.</p>
            <button className={styles.googleBtn} onClick={onBack}>← Back to posts</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Posts</button>
        <span className={styles.headerTitle}>{post ? 'Edit Post' : 'New Post'}</span>
        <button
          className={`${styles.newBtn} ${done ? styles.publishBtnDone : ''}`}
          onClick={handleSave}
          disabled={saving || uploading}
        >
          {saving ? 'Saving…' : post ? 'Save' : 'Publish'}
        </button>
      </div>

      {error && <div className={styles.errorBar}>⚠ {error}</div>}

      <div className={styles.editorArea}>
        {/* Title */}
        <input
          className={styles.titleInput}
          placeholder="Post title…"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarGroup}>
            <ToolBtn active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold"><b>B</b></ToolBtn>
            <ToolBtn active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic"><i>I</i></ToolBtn>
            <ToolBtn active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Underline"><u>U</u></ToolBtn>
          </div>
          <div className={styles.toolbarDivider} />
          <div className={styles.toolbarGroup}>
            <ToolBtn active={editor?.isActive('heading', { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">H2</ToolBtn>
            <ToolBtn active={editor?.isActive('heading', { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} title="Sub-heading">H3</ToolBtn>
          </div>
          <div className={styles.toolbarDivider} />
          <div className={styles.toolbarGroup}>
            <ToolBtn active={editor?.isActive('bulletList')} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bullet list">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg>
            </ToolBtn>
            <ToolBtn active={editor?.isActive('orderedList')} onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numbered list">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2M4 15.5a.5.5 0 011 0c0 .5-1 1-1 1.5h2" strokeLinecap="round"/></svg>
            </ToolBtn>
            <ToolBtn active={editor?.isActive('blockquote')} onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Quote (for Quran verses)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
            </ToolBtn>
          </div>
          <div className={styles.toolbarDivider} />
          <div className={styles.toolbarGroup}>
            <ToolBtn active={false} onClick={() => editor?.chain().focus().setTextAlign('left').run()} title="Align left">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
            </ToolBtn>
            <ToolBtn active={false} onClick={() => editor?.chain().focus().setTextAlign('center').run()} title="Center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
            </ToolBtn>
          </div>
          <div className={styles.toolbarDivider} />
          <div className={styles.toolbarGroup}>
            <ToolBtn
              active={false}
              onClick={() => imgInputRef.current?.click()}
              title="Insert image"
              disabled={uploading}
            >
              {uploading ? '…' : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
            </ToolBtn>
            <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { uploadImage(e.target.files[0]); e.target.value = '' }} />
            <ToolBtn active={false} onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Divider line">—</ToolBtn>
          </div>
          <div className={styles.toolbarDivider} />
          <div className={styles.toolbarGroup}>
            <ToolBtn active={false} onClick={() => editor?.chain().focus().undo().run()} title="Undo">↩</ToolBtn>
            <ToolBtn active={false} onClick={() => editor?.chain().focus().redo().run()} title="Redo">↪</ToolBtn>
          </div>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} className={styles.editorContent} />

        {!post && <p className={styles.draftNote}>✦ Draft auto-saved</p>}
      </div>
    </div>
  )
}

function ToolBtn({ active, onClick, title, children, disabled }) {
  return (
    <button
      className={`${styles.toolBtn} ${active ? styles.toolBtnActive : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
