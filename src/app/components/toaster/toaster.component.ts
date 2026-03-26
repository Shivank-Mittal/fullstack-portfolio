import { Component, inject } from '@angular/core';
import { ToastService } from '../../service/toast-service/toast.service';

@Component({
  selector: 'app-toaster',
  imports: [],
  templateUrl: './toaster.component.html',
  styleUrl: './toaster.component.css',
})
export class ToasterComponent {
  protected readonly toastService = inject(ToastService);
}
