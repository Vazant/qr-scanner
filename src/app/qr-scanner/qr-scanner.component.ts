import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { Html5Qrcode } from "html5-qrcode";
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.scss'],
  standalone: true,
  imports: [CommonModule, NgbModule],
})
export class QrScannerComponent implements OnInit {
  scannedResult: string | null = null;
  isBrowser: boolean;
  currentCamera: 'front' | 'back' = 'back';
  html5QrCode: Html5Qrcode | null = null;
  isCameraInitialized = false; // Новый флаг для отслеживания состояния камеры
  capturedImage: string | null = null; // Хранит изображение в виде Data URL

  constructor(@Inject(PLATFORM_ID) private readonly platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId); // Проверяем, клиент это или сервер
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      console.log('Компонент готов, ожидает вызова openCamera.');
    } else {
      console.warn('Сканер недоступен на сервере.');
    }
  }

  openCamera(): void {
    this.clearResults();
    if (this.isCameraInitialized) {
      console.warn("Камера уже запущена.");
      return;
    }

    const qrReaderElement = document.getElementById("qr-reader");
    if (!qrReaderElement) {
      console.error("Контейнер для камеры не найден!");
      return;
    }

    const fileInput = document.getElementById("qr-image") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = ""; // Сбрасываем значение input
      console.log("Input с файлом очищен.");
    }
    this.clearResults();
    this.html5QrCode = new Html5Qrcode("qr-reader");
    this.isCameraInitialized = true; // Помечаем, что камера инициализирована
    this.startScanner();
  }

  startScanner(): void {
    if (!this.html5QrCode) {
      console.error("Сканер не инициализирован.");
      return;
    }

    const cameraMode = this.currentCamera === 'back' ? { facingMode: "environment" } : { facingMode: "user" };
    const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 };

    this.html5QrCode.start(cameraMode, config,
      (decodedText, decodedResult) => {
        console.log(`Code matched = ${decodedText}`, decodedResult);
        this.scannedResult = decodedText;

        // Получаем элемент <video>
        const videoElement = document.querySelector('#qr-reader > video') as HTMLVideoElement;

        if (videoElement) {
          this.captureAndPauseScanner(videoElement); // Захватываем кадр и останавливаем сканер
        }
      },
      (errorMessage) => {
        if (!errorMessage.includes("No MultiFormat Readers were able to detect the code")) {
          console.warn("Ошибка сканирования:", errorMessage);
        }
      }
    ).catch(err => {
      console.error("Ошибка при запуске сканера:", err);
    });

  }

  stopScanner(): void {
    if (this.html5QrCode) {
      this.html5QrCode.stop().then(() => {
        console.log("Камера остановлена.");
        this.isCameraInitialized = false; // Сбрасываем флаг
      }).catch(err => console.error("Ошибка при остановке камеры:", err));
    }
  }

  switchCamera(): void {
    if (this.html5QrCode) {
      this.html5QrCode.stop().then(() => {
        this.currentCamera = this.currentCamera === 'back' ? 'front' : 'back';
        console.log(`Переключено на ${this.currentCamera} камеру.`);
        this.startScanner();
      }).catch(err => console.error("Ошибка при переключении камеры:", err));
    }
  }

  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.[0]) {
      const file = input.files[0];

      this.clearResults();

      if (this.html5QrCode && this.isCameraInitialized) {
        // Останавливаем камеру перед загрузкой файла
        this.html5QrCode.stop().then(() => {
          console.log("Камера успешно отключена.");
          this.scanFile(file); // Выполняем сканирование файла
        }).catch(err => {
          console.error("Ошибка при остановке камеры:", err);
          alert('Ошибка при переходе в режим загрузки файла.');
        });
      } else {
        this.scanFile(file); // Если камера не запущена, сразу сканируем файл
      }
    }
  }

  private scanFile(file: File): void {
    console.log(this.html5QrCode);
    if (!this.html5QrCode) {
      this.html5QrCode = new Html5Qrcode("qr-reader");
    }

    this.html5QrCode.scanFile(file, true).then((decodedText) => {
      console.log("Отсканировано из файла:", decodedText);
      this.scannedResult = decodedText;
    }).catch(err => {
      console.error("Ошибка при сканировании файла:", err);
      alert('Не удалось отсканировать изображение.');
    });
  }

  copyResults(): void {
    if (this.scannedResult) {
      navigator.clipboard.writeText(this.scannedResult).then(() => {
        console.log("Результат скопирован в буфер обмена.");
      }).catch(err => {
        console.error("Ошибка при копировании результата:", err);
      });
    } else {
      alert("Нет результата для копирования.");
    }
  }
  clearResults(): void {
    this.scannedResult = null;
  }

  saveResult(): void {
    if (this.capturedImage) {
      const timestamp = new Date().toISOString().replace(/[:.-]/g, '_'); // Генерируем имя файла на основе даты и времени
      const fileName = `qr-captured-image_${timestamp}.png`;
  
      const link = document.createElement('a');
      link.href = this.capturedImage; // Используем изображение из capturedImage
      link.download = fileName;
      link.click();
      console.log(`Изображение сохранено как ${fileName}.`);
    } else {
      alert('Нет изображения для сохранения.');
    }
  }
  captureAndPauseScanner(videoElement: HTMLVideoElement): void {
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('Не удалось получить контекст для canvas.');
        return;
      }

      // Устанавливаем размеры canvas
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // Копируем текущий кадр из видео
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Генерируем изображение и сохраняем в память
      this.capturedImage = canvas.toDataURL('image/png');

      // Останавливаем сканер
      if (this.html5QrCode) {
        this.html5QrCode.stop().then(() => {
          console.log('Сканер приостановлен.');
          this.isCameraInitialized = false;
        }).catch(err => console.error('Ошибка при остановке сканера:', err));
      }
    }, 100); // Задержка в 100 мс для стабилизации изображения
  }


  saveImage(dataUrl: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'qr-scan.png';
    link.click();
    console.log('Изображение сохранено.');
  }
  downloadCapturedImage(): void {
    if (!this.capturedImage) {
      alert('Нет изображения для сохранения.');
      return;
    }

    const link = document.createElement('a');
    link.href = this.capturedImage;
    link.download = 'qr-scan.png';
    link.click();
    console.log('Изображение сохранено.');
  }


}
