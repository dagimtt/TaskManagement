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
    
    // Change from single assigned user to list
    public List<UserSimpleDto> AssignedUsers { get; set; } = new List<UserSimpleDto>();
    
    public int? CreatedById { get; set; }
    public string? CreatedByName { get; set; }
    
    public DateTime DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    
    public int? EstimatedHours { get; set; }
    public int? ActualHours { get; set; }
}

public class UserSimpleDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}
    
    public class CreateTaskDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Priority { get; set; } = "Medium";
    
    // Change from single ID to array
    public List<int>? AssignedUserIds { get; set; }
    
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
    
    // Change from single ID to array
    public List<int>? AssignedUserIds { get; set; }
    
    public DateTime? DueDate { get; set; }
    public string? Category { get; set; }
    public int? EstimatedHours { get; set; }
    public int? ActualHours { get; set; }
}
}