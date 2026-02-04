using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TaskManagerApi.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(100)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;
        
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // CORRECT: Many-to-many relationship (new name)
        public ICollection<TaskItem> AssignedTasks { get; set; } = new List<TaskItem>();
        
        // WRONG: Remove this old property if it exists
        // public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
        
        public int RoleId { get; set; }
        
        [ForeignKey("RoleId")]
        public Role Role { get; set; } = null!;
    }
}