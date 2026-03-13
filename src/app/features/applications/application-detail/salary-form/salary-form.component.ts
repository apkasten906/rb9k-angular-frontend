import { Component, Input, OnChanges, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { SalaryInfo } from '../../../../core/models/salary-info.model';

@Component({
  selector: 'app-salary-form',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './salary-form.component.html',
  styleUrls: ['./salary-form.component.scss'],
})
export class SalaryFormComponent implements OnInit, OnChanges {
  @Input() salary: SalaryInfo | null = null;
  @Output() saved = new EventEmitter<Omit<SalaryInfo, 'salaryId' | 'applicationId'>>();

  form!: FormGroup;
  currencies = ['USD', 'GBP', 'EUR', 'CAD', 'AUD'];

  constructor(private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(): void {
    if (this.form) {
      this.patchForm();
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      userExpectedSalary: [null],
      companyOfferedSalary: [null],
      industryAverageSalary: [null],
      currency: ['USD'],
      region: [''],
    });
    this.patchForm();
  }

  private patchForm(): void {
    if (this.salary) {
      this.form.patchValue({
        userExpectedSalary: this.salary.userExpectedSalary,
        companyOfferedSalary: this.salary.companyOfferedSalary,
        industryAverageSalary: this.salary.industryAverageSalary,
        currency: this.salary.currency ?? 'USD',
        region: this.salary.region ?? '',
      });
    }
  }

  onSave(): void {
    const val = this.form.value;
    this.saved.emit({
      userExpectedSalary: val.userExpectedSalary ? Number(val.userExpectedSalary) : null,
      companyOfferedSalary: val.companyOfferedSalary ? Number(val.companyOfferedSalary) : null,
      industryAverageSalary: val.industryAverageSalary ? Number(val.industryAverageSalary) : null,
      currency: val.currency || null,
      region: val.region || null,
    });
  }
}
