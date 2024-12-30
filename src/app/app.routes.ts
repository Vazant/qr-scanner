import { Routes } from '@angular/router';
import { QrScannerComponent } from './qr-scanner/qr-scanner.component';
import { NotFoundComponent } from './not-found/not-found.component';

export const routes: Routes = [
  { path: '', component: QrScannerComponent }, // Главная страница отображает компонент QR-сканера\
  { path: '**', component: NotFoundComponent },
];
