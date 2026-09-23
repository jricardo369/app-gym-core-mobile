import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { ActionSheetController, AlertController, LoadingController, NavController, IonicModule } from '@ionic/angular/lazy';
import { LoginService } from 'src/app/servicios/login.service';
import { API_URL } from 'src/app/app.config';
import { COMPANIA } from 'src/app/app.config';

import { FiltroPipe } from '../../pipes/filtro.pipe';
import { TabbarComponent } from 'src/app/componentes/tabbar/tabbar.component';

@Component({
    selector: 'app-perfil',
    templateUrl: './perfil.page.html',
    styleUrls: ['./perfil.page.scss'],
    imports: [
    IonicModule,
    FiltroPipe,
    TabbarComponent
],
})
export class PerfilPage implements OnInit {

  compania: string = COMPANIA;
  mensaje: any;
  idUsuario: any;
  msjError: any;
  perfiles: any[] = [];
  textoBuscar:string = '';

  listado: any;
  displayed: any[] = [];
  allUsuarios: any[] = [];
  pageSize = 30;
  filtro: 'usuarios' | 'coaches' = 'usuarios';
  infiniteDisabled = false;

  private reqId = 0;

  constructor(private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private navCtrl: NavController,
    private servicio: LoginService,
    public actionSheetController: ActionSheetController,
    public loadingController: LoadingController,
    private alertController: AlertController
  ) {}

  ionViewWillEnter() {
    this.obtenerDatos();
  }

  ngOnInit() {
    this.obtenerDatos();
  }

  activar(idUsuario: any) {
    this.servicio.activarUser(idUsuario).subscribe((response: any) => {
      this.mensaje = response.respuesta;
      this.msjError = response.descripcion;
      if (response.codigo === 200) {
        console.log(response, 'Usuario Activado');
        this.userActivado();
        this.obtenerDatos();
      } else {
        this.msjError();
      }
    });
  }

  desactivar(idUsuario: any) {
    this.servicio.desactivarUser(idUsuario).subscribe((response: any) => {
      this.mensaje = response.respuesta;
      this.msjError = response.descripcion;
      if (response.codigo === 200) {
        console.log(response, 'Usuario Desactivado');
        this.userDesactivado();
        this.obtenerDatos();
      } else {
        this.msjError();
      }
    });
  }

  bPago(idUsuario: any) {
    this.servicio.bloquePorPago(idUsuario).subscribe((response: any) => {
      this.mensaje = response.descripcion;
      this.msjError = response.descripcion;
      if (response.codigo === 200) {
        console.log(response, 'Usuario desactivado por pago');
        this.userDesactivado();
        this.obtenerDatos();
      } else {
        this.msjError();
      }
    });
  }

  menuPerfil() {
    this.navCtrl.navigateRoot('/admin');
  }

  registro() {
    this.navCtrl.navigateRoot('/registro');
  }

  buscar(event: any) {
    this.textoBuscar = event.detail.value || '';
    this.refreshDisplayed();
  }

  cambiarFiltro(event: any) {
    const v = event?.detail?.value;
    if (v === 'coaches' || v === 'usuarios') this.filtro = v;
    this.refreshDisplayed();
  }

  nombreCorto(nombre: any): string {
    const n = (nombre || '').toString().trim();
    return n.length > 30 ? n.slice(0, 30) + '...' : n;
  }

  private getFiltered() {
    let base = this.allUsuarios || [];
    base = base.filter((u: any) =>
      this.filtro === 'coaches' ? Number(u.idRol) === 3 : Number(u.idRol) === 2
    );
    if (!this.textoBuscar) return base;
    const t = this.textoBuscar.toLowerCase();
    return base.filter((u: any) => (u.nombre || '').toLowerCase().includes(t));
  }

  private refreshDisplayed() {
    const filtered = this.getFiltered();
    this.displayed = filtered.slice(0, this.pageSize);
    this.infiniteDisabled = this.displayed.length >= filtered.length;
    this.cdr.detectChanges();
  }

  private updateDisplayed() {
    this.allUsuarios = this.listado?.respuesta || [];
    this.refreshDisplayed();
  }

  loadMore(event: any) {
    const filtered = this.getFiltered();
    const next = this.displayed.length + this.pageSize;
    this.displayed = filtered.slice(0, next);
    this.infiniteDisabled = this.displayed.length >= filtered.length;
    this.cdr.detectChanges();
    setTimeout(() => event.target.complete(), 200);
  }

  async errorCargar() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      message: this.mensaje,
      buttons: ['OK'],
    });

    await alert.present();
  }

  async userActivado() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: this.mensaje,
      buttons: ['OK'],
    });

    await alert.present();
  }

  async userDesactivado() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: this.mensaje,
      buttons: ['OK'],
    });

    await alert.present();
  }

  obtenerDatos() {
    // Pinta caché al instante (si hay) y refresca en segundo plano
    const cached = this.servicio.getUsuariosCache();
    if (cached) {
      this.listado = cached;
      this.mensaje = (cached as any)?.descripcion;
      this.updateDisplayed();
    }
    const my = ++this.reqId;
    if (!cached) {
      this.listado = null;
      this.displayed = [];
      this.allUsuarios = [];
      this.cdr.detectChanges();
    }
    this.servicio.getData(API_URL + 'Usuarios/').subscribe({
      next: (data: any) => {
        this.zone.run(() => {
          if (my !== this.reqId) return;
          this.servicio.setUsuariosCache(data);
          this.listado = data;
          this.mensaje = (data as any)?.descripcion;
          this.updateDisplayed();
          if ((data as any)?.codigo !== 200) {
            this.errorCargar();
          }
        });
      },
      error: () => {
        this.zone.run(() => {
          if (my !== this.reqId) return;
          this.listado = { respuesta: [] };
          this.updateDisplayed();
        });
      }
    });
  }
}
