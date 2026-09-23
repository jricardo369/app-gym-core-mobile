import { Component, Input, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AlertController, IonicModule, NavController } from '@ionic/angular/lazy';
import { Storage } from '@ionic/storage-angular';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-tabbar',
  standalone: true,
  imports: [IonicModule],
  template: `
    <ion-footer class="ion-no-border fit-tabs-footer">
      <ion-tab-bar slot="bottom">
        @if (rolNum === 1) {
          <ion-tab-button tab="home" [class.tab-selected]="active === 'home'" (click)="go('/admin')">
            <ion-icon name="home-outline"></ion-icon>
            <ion-label>Home</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="cal" [class.tab-selected]="active === 'cal'" (click)="go('/caladmin')">
            <ion-icon name="calendar-outline"></ion-icon>
            <ion-label>Schedule</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="users" [class.tab-selected]="active === 'users'" (click)="go('/perfil')">
            <ion-icon name="people-outline"></ion-icon>
            <ion-label>Users</ion-label>
          </ion-tab-button>
        }
        @if (rolNum === 2) {
          <ion-tab-button tab="home" [class.tab-selected]="active === 'home'" (click)="go('/admin')">
            <ion-icon name="home-outline"></ion-icon>
            <ion-label>Home</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="cal" [class.tab-selected]="active === 'cal'" (click)="go('/calalumno')">
            <ion-icon name="calendar-outline"></ion-icon>
            <ion-label>Schedule</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="profile" [class.tab-selected]="active === 'profile'" (click)="go('/user')">
            <ion-icon name="person-outline"></ion-icon>
            <ion-label>Profile</ion-label>
          </ion-tab-button>
        }
        @if (rolNum === 3) {
          <ion-tab-button tab="home" [class.tab-selected]="active === 'home'" (click)="go('/admin')">
            <ion-icon name="home-outline"></ion-icon>
            <ion-label>Home</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="cal" [class.tab-selected]="active === 'cal'" (click)="go('/caladmin')">
            <ion-icon name="calendar-outline"></ion-icon>
            <ion-label>Schedule</ion-label>
          </ion-tab-button>
          <ion-tab-button tab="profile" [class.tab-selected]="active === 'profile'" (click)="go('/user')">
            <ion-icon name="person-outline"></ion-icon>
            <ion-label>Profile</ion-label>
          </ion-tab-button>
        }
        <ion-tab-button tab="logout" (click)="confirmCerrar()">
          <ion-icon name="log-out-outline"></ion-icon>
          <ion-label>Exit</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-footer>
  `,
  styles: [`
    .fit-tabs-footer { background: transparent; }
    .fit-tabs-footer ion-tab-bar {
      --background: #161616;
      --color: #71717a;
      --color-selected: #d5ff5f;
      border-top: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px 24px 0 0;
      padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
      box-shadow: 0 -8px 28px rgba(0,0,0,0.5);
    }
    .fit-tabs-footer ion-tab-button { --color: #71717a; --color-selected: #d5ff5f; font-size: 10px; }
    .fit-tabs-footer ion-tab-button ion-icon { font-size: 22px; }
    .fit-tabs-footer ion-tab-button.tab-selected,
    .fit-tabs-footer ion-tab-button[aria-selected="true"] { color: #d5ff5f; }
    .fit-tabs-footer ion-tab-button.tab-selected ion-icon { color: #d5ff5f; }
  `]
})
export class TabbarComponent implements OnInit, OnDestroy {
  @Input() rol?: number | string;
  rolNum = 2;
  active = 'home';
  private sub?: Subscription;

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private storage: Storage,
    private alertCtrl: AlertController,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.refresh(this.router.url);
    this.sub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(async (e) => await this.refresh(e.urlAfterRedirects));
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private async refresh(url: string) {
    if (this.rol === undefined || this.rol === null || this.rol === '') {
      this.rolNum = (await this.getRolFromStorage()) || 2;
    } else {
      this.rolNum = Number(this.rol) || 2;
    }
    this.setActive(url);
    this.cdr.detectChanges();
  }

  private async getRolFromStorage(): Promise<number> {
    try {
      const u: any = await this.storage.get('DatosUsuario');
      return Number(u?.respuesta?.idRol) || 2;
    } catch {
      return 2;
    }
  }

  private setActive(url: string) {
    if (url.startsWith('/caladmin') || url.startsWith('/calalumno') || url.startsWith('/horarios') || url.startsWith('/clasesalumnos') || url.startsWith('/asisalumno')) this.active = 'cal';
    else if (url.startsWith('/clases') || url.startsWith('/asistentes') || url.startsWith('/crearclase') || url.startsWith('/editarclase')) this.active = 'clases';
    else if (url.startsWith('/perfil') || url.startsWith('/editarperfil') || url.startsWith('/registro')) this.active = 'users';
    else if (url.startsWith('/user') || url.startsWith('/asistenciasusuario') || url.startsWith('/cambiarpass')) this.active = 'profile';
    else this.active = 'home';
  }

  go(path: string) {
    if (this.router.url === path) return;
    this.navCtrl.navigateRoot(path);
  }

  async confirmCerrar() {
    const alert = await this.alertCtrl.create({
      cssClass: 'my-custom-class',
      header: '¿Seguro que desea cerrar sesión?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Aceptar', handler: () => { this.storage.clear(); this.navCtrl.navigateRoot('/login'); } }
      ]
    });
    await alert.present();
  }
}
