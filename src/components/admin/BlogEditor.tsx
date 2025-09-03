import React, { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  authors: string[];
  categories: string[];
  tags: string[];
  draft: boolean;
}

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  authors?: string[];
  categories?: string[];
  tags?: string[];
  draft: boolean;
  content: string;
  sha?: string;
}

interface BlogEditorProps {
  initialPost?: BlogPost | null;
  isEditing?: boolean;
  onSave: (slug: string, frontmatter: PostFrontmatter, content: string, sha?: string) => Promise<void>;
  onCancel: () => void;
}

export default function BlogEditor({ initialPost, isEditing = false, onSave, onCancel }: BlogEditorProps) {
  // Form state
  const [slug, setSlug] = useState(initialPost?.slug || '');
  const [title, setTitle] = useState(initialPost?.title || '');
  const [description, setDescription] = useState(initialPost?.description || '');
  const [date, setDate] = useState(
    initialPost?.date ? new Date(initialPost.date).toISOString().split('T')[0] : 
    new Date().toISOString().split('T')[0]
  );
  const [authors, setAuthors] = useState(initialPost?.authors?.join(', ') || '');
  const [categories, setCategories] = useState(initialPost?.categories?.join(', ') || '');
  const [tags, setTags] = useState(initialPost?.tags?.join(', ') || '');
  const [draft, setDraft] = useState(initialPost?.draft ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      setSlug(generatedSlug);
    }
  }, [title, isEditing]);

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary hover:underline',
        },
      }),
    ],
    content: initialPost?.content || '<p>Start writing your blog post...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  // Image upload via drag and drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success && editor) {
        editor.chain().focus().setImage({ src: data.url }).run();
        toast.success('Image uploaded successfully');
      } else {
        toast.error(data.error || 'Image upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Image upload failed');
    }
  }, [editor]);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false,
    noClick: true,
  });

  // Save functionality
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !slug || !editor) {
      toast.error('Title and slug are required');
      return;
    }

    setIsSaving(true);

    try {
      const frontmatter: PostFrontmatter = {
        title,
        description,
        date,
        authors: authors.split(',').map(a => a.trim()).filter(a => a),
        categories: categories.split(',').map(c => c.trim()).filter(c => c),
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        draft,
      };

      const content = editor.getHTML();

      await onSave(slug, frontmatter, content, initialPost?.sha);
      setLastSaved(new Date());
      toast.success(isEditing ? 'Post updated successfully' : 'Post created successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  // Editor toolbar
  const ToolbarButton = ({ 
    onClick, 
    isActive = false, 
    disabled = false, 
    children 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    disabled?: boolean; 
    children: React.ReactNode 
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Post' : 'Create New Post'}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              {lastSaved && (
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter post title..."
                required
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Slug *
              </label>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="post-slug"
                required
                disabled={isEditing}
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Brief description of the post..."
            />
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="authors" className="block text-sm font-medium text-gray-700 mb-2">
                Authors
              </label>
              <input
                type="text"
                id="authors"
                value={authors}
                onChange={(e) => setAuthors(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Author 1, Author 2"
              />
            </div>

            <div>
              <label htmlFor="categories" className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <input
                type="text"
                id="categories"
                value={categories}
                onChange={(e) => setCategories(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Category 1, Category 2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="draft"
                checked={draft}
                onChange={(e) => setDraft(e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="draft" className="ml-2 text-sm text-gray-700">
                Save as draft
              </label>
            </div>
          </div>

          {/* Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>

            {/* Toolbar */}
            <div className="flex items-center space-x-2 p-3 border border-gray-300 border-b-0 rounded-t-md bg-gray-50">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
              >
                Bold
              </ToolbarButton>
              
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
              >
                Italic
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
              >
                H2
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
              >
                H3
              </ToolbarButton>

              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
              >
                List
              </ToolbarButton>

              <ToolbarButton
                onClick={() => {
                  const url = prompt('Enter link URL:');
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                }}
                isActive={editor.isActive('link')}
              >
                Link
              </ToolbarButton>

              <span className="text-xs text-gray-500 ml-auto">
                Drop images here to upload
              </span>
            </div>

            {/* Editor */}
            <div 
              {...getRootProps()} 
              className={`border border-gray-300 rounded-b-md min-h-[400px] ${
                isDragActive ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Cancel
            </button>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : (isEditing ? 'Update Post' : 'Create Post')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}