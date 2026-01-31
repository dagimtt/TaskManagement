using System.ComponentModel.DataAnnotations; 
using System.Text.Json.Serialization; 
 
namespace TaskManagerApi.Models 
{ 
    public class Role 
    { 
        [Key] 
        public int Id { get; set; } 
 
        [Required] 
        [MaxLength(50)] 
        public string Name { get; set; } = string.Empty; 
 
        public string? Description { get; set; } 
 
        public bool CanViewAllTasks { get; set; } = false; 
        public bool CanEditAllTasks { get; set; } = false; 
        public bool CanManageUsers { get; set; } = false; 
        public bool CanManageRoles { get; set; } = false; 
 
        [JsonIgnore] 
        public System.Collections.Generic.ICollection<User>? Users { get; set; } 
 
        public System.DateTime CreatedAt { get; set; } = System.DateTime.UtcNow; 
    } 
} 
