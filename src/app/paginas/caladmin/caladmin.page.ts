import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController, IonicModule } from '@ionic/angular/lazy';
import { LoginService } from 'src/app/servicios/login.service';
import { Storage } from '@ionic/storage-angular';
import { API_URL, COMPANIA, LOGO } from 'src/app/app.config';
import { FormsModule } from '@angular/forms';

interface DiaSemana {
  key: string;      // yyyy-mm-dd
  num: number;
  dow: string;      // LUN, MAR...
  esHoy: boolean;
}

const DIAS_ES = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const DIAS_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function pad(n: number): string {
  return n < 10 ? '0' + n : '' + n;
}

function keyOf(d: Date): string {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

@Component({
    selector: 'app-caladmin',
    templateUrl: './caladmin.page.html',
    styleUrls: ['./caladmin.page.scss'],
    imports: [IonicModule, FormsModule]})
export class CaladminPage implements OnInit {

  logo: string = LOGO;
  compania = COMPANIA;
  usuario: any;
  idUser: any;
  sociedad: any;
  idRol: any;

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
    private loadingController: LoadingController
  ) {
    this.storage.get('DatosUsuario').then((user) => {
      this.usuario = user;
      this.idUser = this.usuario?.respuesta?.idUsuario;
      this.sociedad = this.usuario?.respuesta?.sociedad;
      this.idRol = this.usuario?.respuesta?.idRol;

      const hoy = new Date();
      this.diaSeleccionado = keyOf(hoy);
      this.construirSemana();
      this.cargarClases();
      this.cdr.detectChanges();
    });
  }

  ngOnInit() {}

  // ===== Semana actual estilo referencia (igual que calalumno) =====
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
  private urlPorRol(fecha: string): string {
    if (Number(this.idRol) === 3) {
      return API_URL + 'Clases/por-fecha/profesor/' + fecha + '/' + this.idUser + '?sociedad=' + this.sociedad;
    }
    return API_URL + 'Clases/activas-para-admin/' + fecha + '?sociedad=' + this.sociedad;
  }

  cargarClases() {
    if (!this.diaSeleccionado || !this.sociedad) return;
    this.cargando = true;
    this.sinClases = false;
    this.mensajeError = '';
    this.clases = [];
    this.cdr.detectChanges();

    this.servicio
      .getData(this.urlPorRol(this.diaSeleccionado))
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
      '/asistentes/' + clase.idClase + '/' + clase.nombre + '/' + clase.profesor + '/' +
      this.diaSeleccionado + '/' + clase.profesorNombre + '/' + clase.descripcionHorario
    );
  }

  tieneLugares(clase: any): boolean {
    const v = clase?.lugaresDisponibles;
    return typeof v === 'string' && !v.startsWith('0') && v !== 'CLASE LLENA';
  }

  claseLlena(clase: any): boolean {
    return clase?.lugaresDisponibles === 'CLASE LLENA';
  }
}
