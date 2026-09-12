import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink, UrlSegment } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';

interface LibraryFile {
  name: string;
  path: string;
  type: 'png' | 'gif';
}

interface LibraryNode {
  name: string;
  path: string;
  folders: LibraryNode[];
  files: LibraryFile[];
}

interface Breadcrumb {
  name: string;
  link: string[];
}

@Component({
  selector: 'app-library',
  imports: [RouterLink],
  templateUrl: './library.component.html',
  styleUrl: './library.component.css'
})
export class LibraryComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private routeSubscription?: Subscription;
  private manifest: LibraryNode | null = null;

  readonly currentNode = signal<LibraryNode | null>(null);
  readonly selectedFile = signal<LibraryFile | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal('');
  readonly breadcrumbs = computed<Breadcrumb[]>(() => {
    const node = this.currentNode();
    const parts = node?.path ? node.path.split('/') : [];

    return [
      { name: 'Bibliotheque', link: ['/library'] },
      ...parts.map((part, index) => ({
        name: part,
        link: ['/library', ...parts.slice(0, index + 1)]
      }))
    ];
  });

  async ngOnInit(): Promise<void> {
    try {
      this.manifest = await firstValueFrom(
        this.http.get<LibraryNode>('/assets/library/library-manifest.json')
      );
      this.syncCurrentNode(this.route.snapshot.url);
      this.routeSubscription = this.route.url.subscribe((segments) => {
        this.syncCurrentNode(segments);
      });
    } catch {
      this.error.set('Impossible de charger la bibliotheque pour le moment.');
    } finally {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  folderLink(folder: LibraryNode): string[] {
    return ['/library', ...folder.path.split('/')];
  }

  folderPreviewUrl(folder: LibraryNode): string {
    const parts = folder.path.split('/');
    const previewPath = [...parts.slice(0, -1), `PREV${folder.name}.png`].join('/');

    return this.libraryAssetUrl(previewPath);
  }

  fileUrl(file: LibraryFile): string {
    return this.libraryAssetUrl(file.path);
  }

  openFile(file: LibraryFile): void {
    this.selectedFile.set(file);
  }

  closeFile(): void {
    this.selectedFile.set(null);
  }

  private syncCurrentNode(segments: UrlSegment[]): void {
    if (!this.manifest) {
      return;
    }

    const pathParts = segments.slice(1).map((segment) => segment.path);
    const node = findNode(this.manifest, pathParts);

    if (!node) {
      this.currentNode.set(this.manifest);
      this.error.set('Dossier introuvable.');
      return;
    }

    this.error.set('');
    this.currentNode.set(node);
  }

  private libraryAssetUrl(path: string): string {
    return `/assets/library/${path.split('/').map(encodeURIComponent).join('/')}`;
  }
}

function findNode(root: LibraryNode, pathParts: string[]): LibraryNode | null {
  return pathParts.reduce<LibraryNode | null>((node, part) => {
    return node?.folders.find((folder) => folder.name === part) ?? null;
  }, root);
}
