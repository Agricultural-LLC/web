import { Octokit } from '@octokit/rest';
import matter from 'gray-matter';

export interface BlogPost {
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

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string | Date;
  authors?: string[];
  categories?: string[];
  tags?: string[];
  draft: boolean;
}

class GitHubCMS {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private branch: string;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GH_PAT,
    });
    this.owner = process.env.GH_OWNER || 'Agricultural-LLC';
    this.repo = process.env.GH_REPO || 'web';
    this.branch = process.env.GH_BRANCH || 'main';
  }

  async getAllPosts(): Promise<BlogPost[]> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: 'src/content/blog',
        ref: this.branch,
      });

      if (!Array.isArray(data)) {
        throw new Error('Expected directory contents');
      }

      const posts: BlogPost[] = [];
      
      for (const file of data) {
        if (file.type === 'file' && file.name.endsWith('.md')) {
          const fileData = await this.octokit.rest.repos.getContent({
            owner: this.owner,
            repo: this.repo,
            path: file.path,
            ref: this.branch,
          });

          if ('content' in fileData.data) {
            const content = Buffer.from(fileData.data.content, 'base64').toString('utf-8');
            const { data: frontmatter, content: markdownContent } = matter(content);
            
            posts.push({
              slug: file.name.replace('.md', ''),
              title: frontmatter.title || '',
              description: frontmatter.description || '',
              date: frontmatter.date || new Date().toISOString(),
              authors: frontmatter.authors || [],
              categories: frontmatter.categories || [],
              tags: frontmatter.tags || [],
              draft: frontmatter.draft || false,
              content: markdownContent,
              sha: fileData.data.sha,
            });
          }
        }
      }

      return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  async getPost(slug: string): Promise<BlogPost | null> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: `src/content/blog/${slug}.md`,
        ref: this.branch,
      });

      if ('content' in data) {
        const content = Buffer.from(data.content, 'base64').toString('utf-8');
        const { data: frontmatter, content: markdownContent } = matter(content);
        
        return {
          slug,
          title: frontmatter.title || '',
          description: frontmatter.description || '',
          date: frontmatter.date || new Date().toISOString(),
          authors: frontmatter.authors || [],
          categories: frontmatter.categories || [],
          tags: frontmatter.tags || [],
          draft: frontmatter.draft || false,
          content: markdownContent,
          sha: data.sha,
        };
      }

      return null;
    } catch (error) {
      if ((error as any).status === 404) {
        return null;
      }
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  async createPost(slug: string, frontmatter: PostFrontmatter, content: string): Promise<BlogPost> {
    try {
      // Check if post already exists
      const existingPost = await this.getPost(slug);
      if (existingPost) {
        throw new Error(`Post with slug "${slug}" already exists`);
      }

      const fileContent = matter.stringify(content, {
        ...frontmatter,
        date: frontmatter.date instanceof Date ? frontmatter.date.toISOString() : frontmatter.date,
      });

      const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: `src/content/blog/${slug}.md`,
        message: `feat: Add new blog post "${frontmatter.title}"`,
        content: Buffer.from(fileContent).toString('base64'),
        branch: this.branch,
      });

      return {
        slug,
        title: frontmatter.title,
        description: frontmatter.description,
        date: frontmatter.date instanceof Date ? frontmatter.date.toISOString() : frontmatter.date,
        authors: frontmatter.authors || [],
        categories: frontmatter.categories || [],
        tags: frontmatter.tags || [],
        draft: frontmatter.draft,
        content,
        sha: data.content?.sha,
      };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  async updatePost(slug: string, frontmatter: PostFrontmatter, content: string, sha: string): Promise<BlogPost> {
    try {
      const fileContent = matter.stringify(content, {
        ...frontmatter,
        date: frontmatter.date instanceof Date ? frontmatter.date.toISOString() : frontmatter.date,
      });

      const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: `src/content/blog/${slug}.md`,
        message: `feat: Update blog post "${frontmatter.title}"`,
        content: Buffer.from(fileContent).toString('base64'),
        sha,
        branch: this.branch,
      });

      return {
        slug,
        title: frontmatter.title,
        description: frontmatter.description,
        date: frontmatter.date instanceof Date ? frontmatter.date.toISOString() : frontmatter.date,
        authors: frontmatter.authors || [],
        categories: frontmatter.categories || [],
        tags: frontmatter.tags || [],
        draft: frontmatter.draft,
        content,
        sha: data.content?.sha,
      };
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  async deletePost(slug: string, sha: string): Promise<void> {
    try {
      await this.octokit.rest.repos.deleteFile({
        owner: this.owner,
        repo: this.repo,
        path: `src/content/blog/${slug}.md`,
        message: `feat: Delete blog post "${slug}"`,
        sha,
        branch: this.branch,
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  async uploadImage(filename: string, buffer: Buffer): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: `public/blog/${filename}`,
        message: `feat: Add blog image ${filename}`,
        content: buffer.toString('base64'),
        branch: this.branch,
      });

      // Return the public URL for the uploaded image
      return `/blog/${filename}`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }
}

export const githubCMS = new GitHubCMS();