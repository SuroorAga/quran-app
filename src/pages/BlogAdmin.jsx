import { useState, useRef } from 'react'
import styles from './BlogAdmin.module.css'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogAdmin({ blogs, onPublish, onUpdate, onDelete, onBack, onExport, onImport, auth }) {
  const { user, loading, isAdmin, signIn, logOut } = auth

  /* ── Auth loading ── */
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>← Back</button>
          <span className={styles.headerTitle}>Blog Admin</span>
        </div>
        <div className={styles.authCenter}>
          <div className={styles.spinner} />
        </div>
      </div>
    )
  }

  /* ── Not signed in ── */
  if (!user) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>← Back</button>
          <span className={styles.headerTitle}>Blog Admin</span>
        </div>
        <div className={styles.authCenter}>
          <div className={styles.authCard}>
            <div className={styles.authIcon}>🔐</div>
            <h2 className={styles.authTitle}>Admin Sign In</h2>
            <p className={styles.authDesc}>
              Sign in with your Google account to write and manage posts.
            </p>
            <button className={styles.googleBtn} onClick={signIn}>
              <GoogleIcon />
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Signed in but not admin ── */
  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={onBack}>← Back</button>
          <span className={styles.headerTitle}>Blog Admin</span>
        </div>
        <div className={styles.authCenter}>
          <div className={styles.authCard}>
            <div className={styles.authIcon}>⛔</div>
            <h2 className={styles.authTitle}>Access Denied</h2>
            <p className={styles.authDesc}>
              <strong>{user.email}</strong> is not an admin account.
            </p>
            <button className={styles.googleBtn} onClick={logOut}>
              Sign out &amp; try another account
            </button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Admin panel ── */
  return <AdminPanel
    blogs={blogs}
    onPublish={onPublish}
    onUpdate={onUpdate}
    onDelete={onDelete}
    onExport={onExport}
    onImport={onImport}
    onBack={onBack}
    user={user}
    onSignOut={logOut}
  />
}

function AdminPanel({ blogs, onPublish, onUpdate, onDelete, onExport, onImport, onBack, user, onSignOut }) {
  const [view, setView] = useState('list')
  const [editId, setEditId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState(false)
  const [done, setDone] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const fileRef = useRef()

  const openNew = () => {
    setTitle(''); setContent(''); setEditId(null); setDone(false); setPreview(false); setView('write')
  }

  const openEdit = (post) => {
    setTitle(post.title); setContent(post.content); setEditId(post.id)
    setDone(false); setPreview(false); setView('write')
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return
    if (editId) await onUpdate(editId, { title, content })
    else await onPublish({ title, content })
    setDone(true)
    setTimeout(() => { setDone(false); setView('list') }, 900)
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    try {
      const n = await onImport(file)
      setImportMsg(`Imported ${n} post${n !== 1 ? 's' : ''}.`)
    } catch {
      setImportMsg('Import failed — check the file is valid JSON.')
    }
    setTimeout(() => setImportMsg(''), 4000)
  }

  const confirmDelete = (post) => {
    if (window.confirm(`Delete "${post.title}"?\n\nThis cannot be undone.`)) onDelete(post.id)
  }

  /* Write / Edit */
  if (view === 'write') {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => setView('list')}>← Posts</button>
          <span className={styles.headerTitle}>{editId ? 'Edit Post' : 'New Post'}</span>
          <button
            className={`${styles.previewToggle} ${preview ? styles.previewToggleOn : ''}`}
            onClick={() => setPreview(p => !p)}
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>

        {preview ? (
          <div className={styles.previewArea}>
            <h1 className={styles.previewTitle}>{title || 'Untitled'}</h1>
            <div className={styles.previewBody}>
              {content.split('\n\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        ) : (
          <div className={styles.editorArea}>
            <label className={styles.fieldLabel}>Title</label>
            <input
              className={styles.titleInput}
              placeholder="Enter a title for your post…"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
            <label className={styles.fieldLabel}>Your Writing</label>
            <textarea
              className={styles.bodyTextarea}
              placeholder={'Write your post here…\n\nLeave a blank line between paragraphs.'}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
        )}

        <div className={styles.editorFooter}>
          <button
            className={`${styles.publishBtn} ${done ? styles.publishBtnDone : ''} ${(!title.trim() || !content.trim()) ? styles.publishBtnDisabled : ''}`}
            onClick={handleSave}
            disabled={!title.trim() || !content.trim() || done}
          >
            {done ? '✓ Published!' : editId ? 'Save Changes' : 'Publish Post'}
          </button>
        </div>
      </div>
    )
  }

  /* List */
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <span className={styles.headerTitle}>My Posts</span>
        <button className={styles.newBtn} onClick={openNew}>+ New</button>
      </div>

      {/* Signed-in user bar */}
      <div className={styles.userBar}>
        {user.photoURL && <img src={user.photoURL} alt="" className={styles.userAvatar} />}
        <span className={styles.userEmail}>{user.email}</span>
        <button className={styles.signOutBtn} onClick={onSignOut}>Sign out</button>
      </div>

      <div className={styles.listArea}>
        {blogs.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✍️</div>
            <p className={styles.emptyTitle}>No posts yet</p>
            <p className={styles.emptyHint}>Tap <strong>+ New</strong> to write your first post.</p>
          </div>
        ) : blogs.map(post => (
          <div key={post.id} className={styles.postRow}>
            <div className={styles.postMain}>
              <div className={styles.postTitle}>{post.title}</div>
              <div className={styles.postDate}>{fmtDate(post.date)}</div>
              <div className={styles.postSnippet}>
                {post.content.slice(0, 100)}{post.content.length > 100 ? '…' : ''}
              </div>
            </div>
            <div className={styles.postActions}>
              <button className={styles.editBtn} onClick={() => openEdit(post)}>Edit</button>
              <button className={styles.deleteBtn} onClick={() => confirmDelete(post)}>Delete</button>
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
        <p className={styles.migrationNote}>
          To bring in old posts, paste each one as a new post — or export from another device and import the JSON file here.
        </p>
      </div>
    </div>
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
