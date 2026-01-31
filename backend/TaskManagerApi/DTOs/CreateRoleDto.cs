// DTOs/CreateRoleDto.cs
namespace TaskManagerApi.DTOs
{
    public class CreateRoleDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool CanViewAllTasks { get; set; } = false;
        public bool CanEditAllTasks { get; set; } = false;
        public bool CanManageUsers { get; set; } = false;
        public bool CanManageRoles { get; set; } = false;
    }
}