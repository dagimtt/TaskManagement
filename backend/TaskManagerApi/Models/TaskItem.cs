// Models/TaskItem.cs
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TaskManagerApi.Models
{
    public class TaskItem
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";
        
        [MaxLength(50)]
        public string Priority { get; set; } = "Medium";
        
        public int? AssignedToId { get; set; }
        
        [ForeignKey("AssignedToId")]
        [JsonIgnore]
        public User? AssignedTo { get; set; }
        
        public DateTime DueDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        
        public int? CreatedById { get; set; }
        
        [ForeignKey("CreatedById")]
        [JsonIgnore]
        public User? CreatedBy { get; set; }
        
        [MaxLength(50)]
        public string? Category { get; set; }
        
        public int? EstimatedHours { get; set; }
        public int? ActualHours { get; set; }
        public bool IsDeleted { get; set; } = false;
    }
}