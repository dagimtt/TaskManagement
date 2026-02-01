namespace TaskManagerApi.DTOs
{
    public class RoleDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        
        // Task Permissions
        public bool CanViewAllTasks { get; set; }
        public bool CanEditAllTasks { get; set; }
        public bool CanCreateTasks { get; set; }
        public bool CanDeleteTasks { get; set; }
        public bool CanAssignTasks { get; set; }
        
        // User Permissions
        public bool CanViewAllUsers { get; set; }
        public bool CanCreateUsers { get; set; }
        public bool CanEditUsers { get; set; }
        public bool CanDeleteUsers { get; set; }
        
        // System Permissions
        public bool CanManageRoles { get; set; }
        public bool CanManagePermissions { get; set; }
        public bool CanViewReports { get; set; }
        public bool CanExportData { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int UserCount { get; set; }
    }
}