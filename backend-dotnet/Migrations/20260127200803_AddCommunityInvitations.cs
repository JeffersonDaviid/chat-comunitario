using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatComunitario.Migrations
{
    /// <inheritdoc />
    public partial class AddCommunityInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommunityInvitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CommunityId = table.Column<Guid>(type: "uuid", nullable: false),
                    InvitedUserCedula = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    InvitedByCedula = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityInvitations_Communities_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Communities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityInvitations_Users_InvitedByCedula",
                        column: x => x.InvitedByCedula,
                        principalTable: "Users",
                        principalColumn: "Cedula",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityInvitations_Users_InvitedUserCedula",
                        column: x => x.InvitedUserCedula,
                        principalTable: "Users",
                        principalColumn: "Cedula",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityInvitations_CommunityId_InvitedUserCedula_Status",
                table: "CommunityInvitations",
                columns: new[] { "CommunityId", "InvitedUserCedula", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityInvitations_InvitedByCedula",
                table: "CommunityInvitations",
                column: "InvitedByCedula");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityInvitations_InvitedUserCedula",
                table: "CommunityInvitations",
                column: "InvitedUserCedula");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityInvitations");
        }
    }
}
