import { Component, OnInit } from '@angular/core';
import { StudentService } from '../student.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-list',
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css']
})
export class StudentListComponent implements OnInit {
  students: any[] = [];
  groupedStudents: any[] = [];
  departments: any[] = [];
  docUrls: string[] = [];
  currentIndex = 0;
  isLoading = false;

  constructor(private studentService: StudentService, private router: Router) {}

  ngOnInit(): void {
    this.studentService.getDepartments().subscribe(res => {
      this.departments = typeof res === 'string' ? JSON.parse(res) : res;
    });
    this.loadStudents();
    this.studentService.get_refreshNeededs().subscribe(() => {
    this.loadStudents(); 
  });
  }

  loadStudents() {
    this.isLoading = true;
    this.studentService.getAllStudents().subscribe({
      next: (res) => {
        console.log('STUDENTS', res);
        this.students = res;
        this.groupStudents();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading students', err);
        this.isLoading = false;
      }
    });
  }

  groupStudents() {
    const map = new Map<number, any>();
    
    this.students.forEach(row => {
      if (!map.has(row.StudentId)) {
        const deptId = Number(row.Department);
        const deptObj = this.departments.find(d => d.DeptID === deptId);

        map.set(row.StudentId, {
          StudentID: row.StudentId,
          FullName: row.FullName,
          Email: row.Email,
          Phoneno: row.Phoneno,
          Gender: row.Gender,
          DepartmentId: deptId,
          DepartmentName: deptObj ? deptObj.DeptName : 'Unknown',
          Address: row.Address,
          AddressProf: row.AddressProf,
          Documents: [] as string[]
        });
      }
      
      if (row.DocumentPath) {
        map.get(row.StudentId).Documents.push(row.DocumentPath);
      }
    });
    
    this.groupedStudents = Array.from(map.values());
    console.log('GROUPED', this.groupedStudents);
  }

   editStudent(s: any) {
    localStorage.setItem("editStudent", JSON.stringify(s));
    window.location.href = "/";
  }

  deleteStudent(studentId: number) {
  if (confirm('Are you sure?')) {
    this.studentService.deleteStudent(studentId).subscribe({
      next: () => {

        this.loadStudents(); 
        alert('Deleted Successfully');
      },
      error: (err) => console.error('Delete failed', err)
    });
  }
}

   groupDocuments(data: any[]): any[] {
  return data.map(s => {
    let docs: string[] = [];

    if (s.DocumentPath) {
      if (s.DocumentPath.trim().startsWith('[')) {
        docs = JSON.parse(s.DocumentPath);
      }
      else {
        docs = [s.DocumentPath];
      }
    }

    return {
      ...s,
      Documents: docs
    };
  });
}

  viewDocument(fileValue: string) {
  this.studentService.getS3DocumentFile(fileValue)
    .subscribe({
      next: res => {
        window.open(res.downloadUrl, '_blank');
      },
      error: err => {
        console.error(err);
        alert('Unable to open document');
      }
    });
}

openDocumentViewer(documents: string[]) {
  this.docUrls = [];
  this.currentIndex = 0;

  documents.forEach(file => {
    this.studentService.getS3DocumentFile(file)
      .subscribe(res => {
        this.docUrls.push(res.downloadUrl);
      });
  });
}


openPresigned(fileValue: string) {
  this.studentService.getS3DocumentFile(fileValue)
    .subscribe(res => {
      this.docUrls[this.currentIndex] = res.downloadUrl;
    });
}

 closeModal() {
    this.docUrls = [];
    this.currentIndex = 0;
  }

  nextFile() {
    if (this.currentIndex < this.docUrls.length - 1) {
      this.currentIndex++;
    }
  }

  prevFile() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

}
