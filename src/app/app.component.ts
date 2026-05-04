import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthTokenService } from './services/auth-token.service';

@Component({
  selector: 'app-root',
  imports: [NavbarComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly authTokenService = inject(AuthTokenService);

  ngOnInit(): void {
    this.authTokenService.captureTokenFromCurrentUrl();
  }
}
