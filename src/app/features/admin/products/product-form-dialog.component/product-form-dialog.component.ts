import { Component, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/services/product.model';

@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule,
  ],
  templateUrl: './product-form-dialog.component.html',
  styleUrl: './product-form-dialog.component.scss',
})
export class ProductFormDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ProductFormDialogComponent>);

  // Data passed from the parent (product to edit, or undefined for add)
  data: { product?: Product } = inject(MAT_DIALOG_DATA);

  isEdit = false;
  isSaving = false;

  form!: FormGroup;

  ngOnInit(): void {
    this.isEdit = !!this.data?.product;
    const p = this.data?.product;

    this.form = this.fb.group({
      title:       [p?.title ?? '',       Validators.required],
      price:       [p?.price ?? null,     Validators.required],
      stock:       [p?.stock ?? 0],
      category:    [p?.category ?? ''],
      description: [p?.description ?? ''],
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.isSaving = true;

    const request$ = this.isEdit
      ? this.productService.updateProduct(this.data.product!.id, this.form.value)
      : this.productService.addProduct(this.form.value);

    request$.subscribe({
      next: () => {
        this.snackBar.open(
          `Product ${this.isEdit ? 'updated' : 'added'} successfully`,
          'OK', { duration: 2000 }
        );
        this.dialogRef.close(true);
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('Failed to save product', 'Dismiss', { duration: 3000 });
      },
    });
  }
}
