using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatComunitario.Migrations
{
    /// <inheritdoc />
    public partial class AddChannelMembers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ChannelMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChannelId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserCedula = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChannelMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChannelMembers_Channels_ChannelId",
                        column: x => x.ChannelId,
                        principalTable: "Channels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChannelMembers_Users_UserCedula",
                        column: x => x.UserCedula,
                        principalTable: "Users",
                        principalColumn: "Cedula",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChannelMembers_ChannelId_UserCedula",
                table: "ChannelMembers",
                columns: new[] { "ChannelId", "UserCedula" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChannelMembers_UserCedula",
                table: "ChannelMembers",
                column: "UserCedula");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChannelMembers");
        }
    }
}
