import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QrScannerComponent } from './qr-scanner.component';
import { CommonModule } from '@angular/common';

describe('QrScannerComponent', () => {
  let component: QrScannerComponent;
  let fixture: ComponentFixture<QrScannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QrScannerComponent],
      imports: [CommonModule],
    }).compileComponents();

    fixture = TestBed.createComponent(QrScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should call startScanner on camera open', () => {
    spyOn(component, 'startScanner');
    component.openCamera();
    expect(component.startScanner).toHaveBeenCalled();
  });

  it('should set scannedResult when QR code is scanned', () => {
    const testResult = 'Test QR Code';
    component.scannedResult = testResult;
    fixture.detectChanges();
    expect(component.scannedResult).toBe(testResult);
  });

  it('should stop and restart scanner when switching cameras', () => {
    spyOn(component, 'stopScanner').and.callThrough();
    spyOn(component, 'startScanner').and.callThrough();
    component.switchCamera();
    expect(component.stopScanner).toHaveBeenCalled();
    expect(component.startScanner).toHaveBeenCalled();
    expect(component.currentCamera).toBe('front'); // Assuming default is 'back'
  });

  it('should handle file upload and scan', () => {
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;

    spyOn(component, 'uploadFile').and.callThrough();
    component.uploadFile(event);

    expect(component.uploadFile).toHaveBeenCalled();
  });
});
