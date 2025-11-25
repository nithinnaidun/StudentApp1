using System.ComponentModel.DataAnnotations;

namespace StudentApplication.Controllers.Models
{
    public class Student
    {
        
        public int studentID {  get; set; }
       
        public string FullName { get; set; }
        public string Email { get; set; }

        public string Phoneno { get; set; }
        public string Gender { get; set; }
        public string Department { get; set; }
        public string Address { get; set; }
        public string AddressProf { get; set; }
        public DateTime CreatedAt { get; set; }
       
    }
}
