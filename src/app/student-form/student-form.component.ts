import { Component, OnInit } from '@angular/core';
import { StudentService } from '../student.service';
import { Student } from '../student.model';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-student-form',
  templateUrl: './student-form.component.html',
  styleUrls: ['./student-form.component.css']
})
export class StudentFormComponent implements OnInit {

  model: Student = {
    studentID: 0,
    FullName: "",
    Email: "",
    Phoneno: "",
    Gender: "",
    Department: "0",
    Address: "",
    AddressProf: ""
  };

  proofList: string[] = [];
  selectedFiles!: FileList;
  DepartmentList: any[] = [];
  emailExists: boolean = false;
  phoneExists: boolean = false;
  isProcessing: boolean = false;

  constructor(private studentService: StudentService) {}

  ngOnInit() {
    // optional quick AES test (if you want)
    try { this.studentService.testAES?.(); } catch { /* ignore */ }

    const data = localStorage.getItem("editStudent");
    if (data) {
      const s: any = JSON.parse(data);

      this.model = {
        studentID: s.studentID,
        FullName: s.FullName ?? s.fullName ?? "",
        Email: s.Email ?? s.email ?? "",
        Phoneno: s.Phoneno ?? s.phoneno ?? "",
        Gender: s.Gender ?? s.gender ?? "",
        Department: String(s.Department ?? s.department ?? "0"),
        Address: s.Address ?? s.address ?? "",
        AddressProf: s.AddressProf ?? s.addressProf ?? "",
        CreatedAt: s.CreatedAt ?? new Date()
      };

      this.proofList = this.model.AddressProf ? this.model.AddressProf.split(',') : [];
    }

    this.studentService.getDepartments().subscribe(
      res => this.DepartmentList = res,
      err => console.error("Failed to load departments", err)
    );
  }

  toggleProof(event: any) {
    const value = event.target.value;
    if (event.target.checked) this.proofList.push(value);
    else this.proofList = this.proofList.filter(x => x !== value);
    this.model.AddressProf = this.proofList.join(',');
  }

  onFileSelected(event: any) {
    const files = event.target?.files as FileList | null;
    if (files && files.length > 0) {
      this.selectedFiles = files;
      console.log('Files selected:', files);
    } else {
      this.selectedFiles = undefined!;
    }
  }

  onSubmit(form: any) {
    // validation
    if (!this.model.FullName?.trim()) return alert("Full Name is required");
    if (!this.model.Phoneno?.trim()) return alert("Phone Number is required");
    if (this.model.Phoneno.length !== 10) return alert("Invalid Phone Number");
    if (!this.model.Email?.trim()) return alert("Email is required");
    if (!this.model.Gender) return alert("Gender is required");
    if (!this.model.Department || this.model.Department === "") return alert("Department is required");
    if (!this.model.Address?.trim()) return alert("Address is required");
    if (this.proofList.length === 0) return alert("Select at least one Address Proof");

    this.model.CreatedAt = new Date();

    if (this.model.studentID && this.model.studentID > 0) {
      this.updateStudent(form);
    } else {
      this.insertStudent(form);
    }
  }

  // ---------- INSERT ----------
  insertStudent(form: any) {
    this.emailExists = false;
    this.phoneExists = false;
    this.isProcessing = true;

    this.studentService.insertStudent(this.model).pipe(
      finalize(()=> this.isProcessing = false)
    ).subscribe({
      next: (res: any) => {
        const newId = res?.newStudentID;
        console.log("Inserted new student id:", newId);

        // if no files selected -> done
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
          alert("Student added successfully!");
          this.resetForm(form);
          return;
        }

        // prepare FormData (key "files" expected by backend)
        const fd = new FormData();
        for (let i = 0; i < this.selectedFiles.length; i++) {
          fd.append("files", this.selectedFiles[i]);
        }

        // upload files (backend returns { filePaths: [...] })
        this.studentService.uploadDocument(fd).subscribe({
          next: (fileRes: any) => {
            const filePaths: string[] = fileRes?.filePaths ?? [];
            if (filePaths.length === 0) {
              console.error("Upload returned no paths", fileRes);
              alert("Files uploaded but server returned no paths.");
              return;
            }

            // save CSV of paths to DB
            const csv = filePaths.join(',');
            this.studentService.updateDocumentPath(newId, csv).subscribe({
              next: () => {
                alert("Student & all documents saved!");
                this.resetForm(form);
              },
              error: (err) => {
                console.error("Failed to update document path", err);
                alert("Student added but saving document paths failed.");
              }
            });
          },
          error: (err) => {
            console.error("File upload failed:", err);
            alert("Student added, but file upload failed.");
          }
        });
      },

      error: (err) => {
        console.error("Insert Error:", err);
        if (err.error?.message === "Email already exists") {
          this.emailExists = true;
          return;
        }
        if (err.error?.message === "Phone number already exists") {
          this.phoneExists = true;
          return;
        }
        alert("Insert failed! Check console.");
      }
    });
  }

  // ---------- UPDATE ----------
  updateStudent(form: any) {
    this.model.AddressProf = this.proofList.join(',');
    this.model.CreatedAt = new Date();
    this.isProcessing = true;

    this.studentService.updateStudent(this.model.studentID, this.model).pipe(
      finalize(()=> this.isProcessing = false)
    ).subscribe({
      next: (res: any) => {
        // if no files selected -> done
        if (!this.selectedFiles || this.selectedFiles.length === 0) {
          alert("Updated successfully!");
          this.resetForm(form);
          localStorage.removeItem("editStudent");
          return;
        }

        // upload each file using same multiple-files endpoint
        const fd = new FormData();
        for (let i = 0; i < this.selectedFiles.length; i++) {
          fd.append("files", this.selectedFiles[i]);
        }

        this.studentService.uploadDocument(fd).subscribe({
          next: (fileRes: any) => {
            const filePaths: string[] = fileRes?.filePaths ?? [];
            if (filePaths.length === 0) {
              console.error("Upload returned no paths", fileRes);
              alert("Files uploaded but server returned no paths.");
              return;
            }

            const csv = filePaths.join(',');
            this.studentService.updateDocumentPath(this.model.studentID, csv).subscribe({
              next: () => {
                alert("Updated successfully including documents!");
                this.resetForm(form);
                localStorage.removeItem("editStudent");
              },
              error: (err) => {
                console.error("Failed to update document path", err);
                alert("Update succeeded but saving document paths failed.");
              }
            });
          },
          error: (err) => {
            console.error("File upload failed:", err);
            alert("Update succeeded, but file upload failed.");
          }
        });
      },
      error: (err) => {
        console.error("Update Error:", err);
        if (err.error?.message === "Email already exists") {
          alert("Email already exists!");
          return;
        }
        if (err.error?.message === "Phone number already exists") {
          alert("Phone number already exists!");
          return;
        }
        alert("Update failed! Check console.");
      }
    });
  }

  // ---------- UPLOAD TO S3 (uses encrypted AWS keys from backend) ----------
  uploadFilesToS3() {
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      return alert("Please select files first.");
    }

    this.studentService.getAwsKeys().subscribe({
      next: (res: any) => {
        // NOTE: your StudentService.decryptAES(cipherText) should exist
        // It decrypts using client-side AES key/iv you defined in service.
        try {
          const accessKeyEnc = res?.accessKey;
          const secretKeyEnc = res?.secretKey;
          const bucketEnc = res?.bucketName;

          const accessKey = this.studentService.decryptAES(accessKeyEnc);
          const secretKey = this.studentService.decryptAES(secretKeyEnc);
          const bucketName = this.studentService.decryptAES(bucketEnc);

          console.log("Decrypted AWS access:", accessKey);
          console.log("Decrypted AWS secret:", secretKey);
          console.log("Decrypted bucket:", bucketName);

          const fd = new FormData();
          for (let i = 0; i < this.selectedFiles.length; i++) {
            fd.append("files", this.selectedFiles[i]);
          }

          this.studentService.uploadToS3(fd, accessKey, secretKey, bucketName)
            .subscribe({
              next: (uploadRes) => console.log("S3 upload response:", uploadRes),
              error: (err) => console.error("S3 upload error:", err)
            });
        } catch (ex) {
          console.error("Failed decrypting AWS keys", ex);
          alert("Failed to decrypt AWS keys. Check console.");
        }
      },
      error: err => {
        console.error("Failed to get AWS keys", err);
        alert("Failed to retrieve AWS keys.");
      }
    });
  }

  editStudent(s: any) {
    localStorage.setItem("editStudent", JSON.stringify(s));
    window.location.href = "/";
  }

  resetForm(form: any) {
    form.reset();
    this.proofList = [];
    this.selectedFiles = undefined!;
    localStorage.removeItem("editStudent");
  }
}
