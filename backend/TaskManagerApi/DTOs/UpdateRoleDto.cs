// DTOs/UpdateRoleDto.cs
namespace TaskManagerApi.DTOs
{
    public class UpdateRoleDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public bool? CanViewAllTasks { get; set; }
        public bool? CanEditAllTasks { get; set; }
        public bool? CanManageUsers { get; set; }
        public bool? CanManageRoles { get; set; }
    }
}