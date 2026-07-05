import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface DevBlogItem {
  filename: string;
  id: number;
  content: string;
}

interface DevBlogList {
  list: DevBlogItem[];
}

@Component({
  selector: 'app-devblog',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './devblog.component.html',
  styleUrl: './devblog.component.css'
})
export class DevblogComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly devblogs = signal<DevBlogItem[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.loadDevBlogs();
      this.devblogs.set(data.list);
    } catch (err) {
      this.error.set('Impossible de charger la liste des devblogs.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadDevBlogs(): Promise<DevBlogList> {
    const response = await this.http.get<DevBlogList>('/assets/devblog/devblogs.json').toPromise();
    if (!response) {
      throw new Error('No data');
    }
    return response;
  }
}
