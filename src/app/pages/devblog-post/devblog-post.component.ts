import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

interface DevBlogItem {
  filename: string;
  id: number;
  content: string;
}

interface DevBlogList {
  list: DevBlogItem[];
}

@Component({
  selector: 'app-devblog-post',
  standalone: true,
  templateUrl: './devblog-post.component.html',
  styleUrl: './devblog-post.component.css'
})
export class DevblogPostComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly document = inject(DOCUMENT);

  readonly blog = signal<DevBlogItem | null>(null);
  readonly htmlContent = signal<SafeHtml | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const id = this.getBlogId();
      if (id === null) {
        throw new Error('ID not found');
      }

      const blog = await this.findBlogById(id);
      if (!blog) {
        throw new Error('Blog not found');
      }

      this.blog.set(blog);
      await this.loadHtmlContent(blog.filename);
    } catch (err) {
      this.error.set('Article non trouvé.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private getBlogId(): number | null {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === null) {
      return null;
    }
    return Number(idParam);
  }

  private async findBlogById(id: number): Promise<DevBlogItem | null> {
    const data = await this.loadDevBlogs();
    return data.list.find((blog) => blog.id === id) ?? null;
  }

  private async loadDevBlogs(): Promise<DevBlogList> {
    const response = await this.http.get<DevBlogList>('/assets/devblog/devblogs.json').toPromise();
    if (!response) {
      throw new Error('No data');
    }
    return response;
  }

  private async loadHtmlContent(filename: string): Promise<void> {
    try {
      const content = await this.http.get(`/assets/devblog/${filename}`, { responseType: 'text' }).toPromise();
      if (content) {
        const { html, styles } = this.extractContentAndStyles(content);
        this.injectStyles(styles);
        this.htmlContent.set(this.sanitizer.bypassSecurityTrustHtml(html));
      }
    } catch {
      this.error.set('Impossible de charger le contenu de l\'article.');
    }
  }

  private extractContentAndStyles(html: string): { html: string; styles: string } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const head = doc.head;
    let styles = '';
    
    // Extraire les styles du head
    const styleElements = head.querySelectorAll('style');
    styleElements.forEach(style => {
      styles += style.textContent + '\n';
    });
    
    // Extraire le body avec tous ses attributs (y compris style inline)
    const body = doc.body;
    const bodyHtml = body.innerHTML;
    
    // Remplacer les sélecteurs 'body' par '.devblog-post__content' pour éviter de styliser tout le body de la page
    const scopedStyles = styles.replace(/body/g, '.devblog-post__content');
    
    return { html: bodyHtml, styles: scopedStyles };
  }

  private injectStyles(css: string): void {
    // Créer un élément style si ce n'est pas déjà fait
    let styleElement = this.document.getElementById('devblog-post-styles');
    if (!styleElement) {
      styleElement = this.document.createElement('style');
      styleElement.id = 'devblog-post-styles';
      this.document.head.appendChild(styleElement);
    }
    
    // Mettre à jour le contenu CSS
    styleElement.textContent = css;
  }

  ngOnDestroy(): void {
    // Nettoyer les styles injectés quand on quitte la page
    const styleElement = this.document.getElementById('devblog-post-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }
}
