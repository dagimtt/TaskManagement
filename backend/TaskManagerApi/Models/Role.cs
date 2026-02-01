using System.ComponentModel.DataAnnotations;

namespace TaskManagerApi.Models
{
    public class Role
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(200)]
        public string? Description { get; set; }
        
        // Permission flags - Add these new properties
        public bool CanViewAllTasks { get; set; } = false;
        public bool CanEditAllTasks { get; set; } = false;
        public bool CanCreateTasks { get; set; } = false;
        public bool CanDeleteTasks { get; set; } = false;
        public bool CanAssignTasks { get; set; } = false;
        public bool CanViewAllUsers { get; set; } = false;
        public bool CanCreateUsers { get; set; } = false;
        public bool CanEditUsers { get; set; } = false;
        public bool CanDeleteUsers { get; set; } = false;
        public bool CanManageRoles { get; set; } = false;
        public bool CanManagePermissions { get; set; } = false;
        public bool CanViewReports { get; set; } = false;
        public bool CanExportData { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}