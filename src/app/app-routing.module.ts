import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { StudentFormComponent } from './student-form/student-form.component';
import { StudentListComponent } from './student-list/student-list.component';

const routes: Routes = [
  { path: '', component: StudentFormComponent , title:'Home Page'},  
  { path: 'students', component: StudentListComponent} 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
