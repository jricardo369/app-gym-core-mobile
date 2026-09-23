import { Component, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, RouteReuseStrategy, Router } from '@angular/router';
import { Storage } from '@ionic/storage-angular';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular/lazy';
import { HttpClientModule } from '@angular/common/http';
import { COMPANIA } from './app.config';
import { IconsService } from './servicios/icons.service';
import { TabbarComponent } from './componentes/tabbar/tabbar.component';
import { filter } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonicModule, HttpClientModule, TabbarComponent]
})
export class AppComponent {
  compania = COMPANIA;
  showTabs = false;

  constructor(
    private storage: Storage,
    private iconsService: IconsService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.storage.create();
    await this.updateTabsVisibility(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(async (e) => await this.updateTabsVisibility(e.urlAfterRedirects));
  }

  private async updateTabsVisibility(url: string) {
    if (url.startsWith('/login')) {
      this.showTabs = false;
      this.cdr.detectChanges();
      return;
    }
    try {
      const u: any = await this.storage.get('DatosUsuario');
      this.showTabs = !!u?.respuesta;
    } catch {
      this.showTabs = false;
    }
    this.cdr.detectChanges();
  }
}
