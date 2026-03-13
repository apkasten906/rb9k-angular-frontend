import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ResumeService } from '../../../../core/services/resume.service';
import { CoverLetterService } from '../../../../core/services/cover-letter.service';
import { Resume } from '../../../../core/models/resume.model';
import { CoverLetter } from '../../../../core/models/cover-letter.model';

export interface DocumentLinkerData {
  userId: number;
  currentResumeId: number | null;
  currentCoverLetterId: number | null;
}

export interface DocumentLinkerResult {
  resumeId: number | null;
  coverLetterId: number | null;
}

@Component({
  selector: 'app-document-linker',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './document-linker.component.html',
  styleUrls: ['./document-linker.component.scss'],
})
export class DocumentLinkerComponent implements OnInit {
  form!: FormGroup;
  resumes: Resume[] = [];
  coverLetters: CoverLetter[] = [];

  constructor(
    private readonly fb: FormBuilder,
    private readonly resumeService: ResumeService,
    private readonly coverLetterService: CoverLetterService,
    private readonly dialogRef: MatDialogRef<DocumentLinkerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DocumentLinkerData
  ) {}

  ngOnInit(): void {
    this.resumes = this.resumeService.getByUser(this.data.userId);
    this.coverLetters = this.coverLetterService.getByUser(this.data.userId);

    this.form = this.fb.group({
      resumeId: [this.data.currentResumeId],
      coverLetterId: [this.data.currentCoverLetterId],
    });
  }

  confirm(): void {
    const result: DocumentLinkerResult = this.form.value;
    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  isDeleted(resume: Resume): boolean {
    return resume.status === 'deleted';
  }

  isCoverLetterDeleted(cl: CoverLetter): boolean {
    return cl.status === 'deleted';
  }
}
