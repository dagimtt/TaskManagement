// DTOs/TaskDto.cs
namespace TaskManagerApi.DTOs
{
    public class TaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string? Category { get; set; }
        
        // Assigned user info
        public int? AssignedToId { get; set; }
        public string? AssignedToName { get; set; }
        
        public int? CreatedById { get; set; }
        public string? CreatedByName { get; set; }
        
        // Dates
        public DateTime DueDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        
        // Time tracking
        public int? EstimatedHours { get; set; }
        public int? ActualHours { get; set; }
    }
    
    public class CreateTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Priority { get; set; } = "Medium";
        public int? AssignedToId { get; set; }
        public DateTime DueDate { get; set; }
        public string? Category { get; set; }
        public int? EstimatedHours { get; set; }
    }
    
    public class UpdateTaskDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public int? AssignedToId { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Category { get; set; }
        public int? EstimatedHours { get; set; }
        public int? ActualHours { get; set; }
    }
}