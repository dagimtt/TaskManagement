// DTOs/RoleDto.cs
namespace TaskManagerApi.DTOs
{
    public class RoleDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool CanViewAllTasks { get; set; }
        public bool CanEditAllTasks { get; set; }
        public bool CanManageUsers { get; set; }
        public bool CanManageRoles { get; set; }
        public DateTime CreatedAt { get; set; }
        public int UserCount { get; set; }
    }
}