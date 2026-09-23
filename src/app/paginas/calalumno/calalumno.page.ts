import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController, IonicModule } from '@ionic/angular/lazy';
import { LoginService } from 'src/app/servicios/login.service';
import { Storage } from '@ionic/storage-angular';
import { LOGO } from 'src/app/app.config';
 import { API_URL,COMPANIA } from 'src/app/app.config';
import { FormsModule } from '@angular/forms';
import { TabbarComponent } from 'src/app/componentes/tabbar/tabbar.component';

interface DiaSemana {
  key: string;      // yyyy-mm-dd
  num: number;
  dow: string;      // LUN, MAR...
  esHoy: boolean;
}

const DIAS_ES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const DIAS_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

function keyOf(d: Date): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

@Component({
    selector: 'app-calalumno',
    templateUrl: './calalumno.page.html',
    styleUrls: ['./calalumno.page.scss'],
    imports: [IonicModule, FormsModule, TabbarComponent]})
export class CalalumnoPage implements OnInit {

  logo = LOGO;
  compania = COMPANIA;
  usuario: any;
  numeroUsuario: any;
  idUsuario: any;
  idRol: any;
  nombre: any;

  semana: DiaSemana[] = [];
  offsetSemana = 0;
  diaSeleccionado = '';
  fechaLabel = '';
  tituloMes = '';

  clases: any[] = [];
  cargando = false;
  sinClases = false;
  mensajeError = '';

  constructor(
    public alertController: AlertController,
    public navCtrl: NavController,
    private storage: Storage,
    private cdr: ChangeDetectorRef,
    private servicio: LoginService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {
    this.storage.get('DatosUsuario').then((data) => {
      this.usuario = data;
      this.numeroUsuario = this.usuario.respuesta.idUsuario;
      this.idRol = this.usuario.respuesta.idRol;
      this.nombre = this.usuario.respuesta.nombre;

      const hoy = new Date();
      this.diaSeleccionado = keyOf(hoy);
      this.construirSemana();
      this.cargarClases();
      this.bloqueado(this.numeroUsuario);
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {}

  // ===== Semana actual estilo referencia =====
  private lunesDeLaSemana(base: Date): Date {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    const dow = (d.getDay() + 6) % 7; // lunes = 0
    d.setDate(d.getDate() - dow + this.offsetSemana * 7);
    return d;
  }

  construirSemana() {
    const lunes = this.lunesDeLaSemana(new Date());
    const hoyKey = keyOf(new Date());
    this.semana = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i);
      const k = keyOf(d);
      this.semana.push({ key: k, num: d.getDate(), dow: DIAS_ES[d.getDay()], esHoy: k === hoyKey });
    }
    const ref = this.parseKey(this.diaSeleccionado) || new Date();
    this.fechaLabel = DIAS_LARGO[ref.getDay()] + ', ' + ref.getDate() + ' de ' + MESES_LARGO[ref.getMonth()];
    const mid = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + 3);
    this.tituloMes = MESES_LARGO[mid.getMonth()] + ' ' + mid.getFullYear();
    this.cdr.detectChanges();
  }

  private parseKey(key: string): Date | null {
    if (!key) return null;
    const p = key.split('-');
    if (p.length !== 3) return null;
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  semanaAnterior() {
    this.offsetSemana--;
    this.construirSemana();
  }

  semanaSiguiente() {
    this.offsetSemana++;
    this.construirSemana();
  }

  irHoy() {
    this.offsetSemana = 0;
    this.diaSeleccionado = keyOf(new Date());
    this.construirSemana();
    this.cargarClases();
  }

  seleccionarDia(dia: DiaSemana) {
    if (this.diaSeleccionado === dia.key) return;
    this.diaSeleccionado = dia.key;
    this.construirSemana();
    this.cargarClases();
  }

  // ===== Clases del día en la misma pantalla =====
  cargarClases() {
    if (!this.numeroUsuario || !this.diaSeleccionado) return;
    this.cargando = true;
    this.sinClases = false;
    this.mensajeError = '';
    this.clases = [];
    this.cdr.detectChanges();

    this.servicio
      .getData(API_URL + 'Clases/por-fecha/' + this.diaSeleccionado + '/' + this.numeroUsuario)
      .subscribe({
        next: (data: any) => {
          this.cargando = false;
          if (data?.codigo === 200) {
            const r = data?.respuesta;
            this.clases = Array.isArray(r) ? r : [];
            this.sinClases = this.clases.length === 0;
          } else {
            this.clases = [];
            this.sinClases = true;
            this.mensajeError = data?.descripcion || '';
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando = false;
          this.clases = [];
          this.sinClases = true;
          this.cdr.detectChanges();
        }
      });
  }

  verClase(clase: any) {
    this.navCtrl.navigateForward(
      '/lugares/' + this.diaSeleccionado + '/' + clase.descripcionHorario + '/' +
      clase.idClase + '/' + clase.asistencia + '/' + clase.lugar + '/' +
      clase.claseLlena + '/' + clase.isListaEspera
    );
  }

  tieneLugares(clase: any): boolean {
    const v = clase?.lugaresDisponibles;
    return typeof v === 'string' && !v.startsWith('0') && v !== 'CLASE LLENA';
  }

  claseLlena(clase: any): boolean {
    return clase?.lugaresDisponibles === 'CLASE LLENA';
  }

  // Cerrar sesión

  cerrarSesion() {
    this.storage.clear();
    this.cerrandoSesion();
    this.navCtrl.navigateRoot('/login');
  }

  async cerrandoSesion() {
    const loading = await this.loadingCtrl.create({
      cssClass: 'my-custom-class',
      spinner: 'crescent',
      translucent: true,
      message: 'Cerrando sesion',
      duration: 700});
    await loading.present();

    const { role, data } = await loading.onDidDismiss();
  }

  async confirmCerrar() {
    const alert = await this.alertCtrl.create({
      cssClass: 'my-custom-class',
      header: '¿Seguro que desea cerrar sesión?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            console.log('Cancelar');
          }},
        {
          text: 'Aceptar',
          handler: () => {
            this.cerrarSesion();
            console.log('Aceptar');
          }},
      ]});

    await alert.present();
  }
  // Fin cerrar sesión

  atras() {
    this.navCtrl.navigateRoot('/admin');
  }

  bloqueado(idUsuario: any) {
    this.servicio
      .getData(
        API_URL + 'Usuarios/bloqueo-por-pago/' +
          idUsuario
      )
      .subscribe((data) => {
        this.usuario = data;

        if (this.usuario.codigo === 500) {
          this.storage.clear();
          this.navCtrl.navigateRoot('/login');
          this.msjBloqueado(this.usuario.descripcion);
        }
      });

    return;
  }

  async msjBloqueado(descripcion: any) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: descripcion,
      // message: descripcion,
      buttons: ['OK']});

    await alert.present();
  }
}
