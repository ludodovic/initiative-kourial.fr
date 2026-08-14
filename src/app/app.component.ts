import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthTokenService } from './services/auth-token.service';

@Component({
  selector: 'app-root',
  imports: [NavbarComponent, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly authTokenService = inject(AuthTokenService);

  constructor() {
    this.authTokenService.captureTokenFromCurrentUrl();
  }
}
