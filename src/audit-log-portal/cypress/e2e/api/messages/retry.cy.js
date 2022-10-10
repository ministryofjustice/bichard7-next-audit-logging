describe("WHEN you retry a message", () => {
  beforeEach(() => cy.clearCookies())
  it("AND the JWT is valid THEN return 200", () => {
    cy.request({
      url: "/api/messages/65c3702b-7884-473b-9201-c83f299543c4/retry",
      headers: {
        Cookie:
          ".AUTH=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IkJpY2hhcmQwMSIsImV4Y2x1c2lvbkxpc3QiOltdLCJpbmNsdXNpb25MaXN0IjpbIkIwMSIsIkI0MU1FMDAiLCIwMDEiLCIwMDIiLCIwMDQiLCIwMTQiLCIwNDUiXSwiZW1haWxBZGRyZXNzIjoiYmljaGFyZDAxQGV4YW1wbGUuY29tIiwiZ3JvdXBzIjpbIkI3QWxsb2NhdG9yIiwiQjdBdWRpdCIsIkI3RXhjZXB0aW9uSGFuZGxlciIsIkI3R2VuZXJhbEhhbmRsZXIiLCJCN1N1cGVydmlzb3IiLCJCN1RyaWdnZXJIYW5kbGVyIiwiQjdVc2VyTWFuYWdlciIsIkI3QXVkaXRMb2dnaW5nTWFuYWdlciJdLCJpZCI6IjBkZjRkZjNlLTE1OTYtNDNmMi04MzJhLTY4MDU1MjNmNDc5NSIsImlhdCI6MTYzNzc1NjIxNCwiZXhwIjoxNjM3NzU2ODE0LCJpc3MiOiJCaWNoYXJkIn0.TUh_742L3Rq9vJB4LzHfEDZUeYtxhAPCNLioY9GO2g4; sid=Fe26.2**2024593fd8909a4a3d387eec0cbf4315c4e7003acd4674a8a08887f71a998955*XchNIB6quVfbLjMDWgFqBA*_YsUHFJnThDGtjMmvmunNxR-qmeYG-nWA6fcHSATGRlh9saL8Y9kfjknUk3ot65Iy1RwLI5oyH19TALw_c-KH7Hgm5j2gW2KhTSbTwxmSyBBgsioO4i-RbyCKdU1yCE4QXZMRFUZkM6TiKa5v6cBObchuo6cHeLsPlbatrzMGDU86I4uliJq-y200flsR00sRe5ZyGbq_R8-9-LeFowWpsVypSN-Df9vEEidxKbDlSk**d442f8dc30a32b33776857a96f30ea5aee24013e9ecfb3d3feeed19beee2cd7d*w_baEE6E68fzbt8a0G7umxyGNke_niFuXu8piBhGay4"
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })

  it("AND the JWT is invalid THEN return 401", () => {
    cy.request({
      failOnStatusCode: false,
      url: "/api/messages/65c3702b-7884-473b-9201-c83f299543c4/retry",
      headers: {
        Cookie:
          ".AUTH=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI______INVALID_JWT__________bkxpc3QiOltdLCJpbmNsdXNpb25MaXN0IjpbIkIwMSIsIkI0MU1FMDAiLCIwMDEiLCIwMDIiLCIwMDQiLCIwMTQiLCIwNDUiXSwiZW1haWxBZGRyZXNzIjoiYmljaGFyZDAxQGV4YW1wbGUuY29tIiwiZ3JvdXBzIjpbIkI3QWxsb2NhdG9yIiwiQjdBdWRpdCIsIkI3RXhjZXB0aW9uSGFuZGxlciIsIkI3R2VuZXJhbEhhbmRsZXIiLCJCN1N1cGVydmlzb3IiLCJCN1RyaWdnZXJIYW5kbGVyIiwiQjdVc2VyTWFuYWdlciIsIkI3QXVkaXRMb2dnaW5nTWFuYWdlciJdLCJpZCI6IjBkZjRkZjNlLTE1OTYtNDNmMi04MzJhLTY4MDU1MjNmNDc5NSIsImlhdCI6MTYzNzc1NjIxNCwiZXhwIjoxNjM3NzU2ODE0LCJpc3MiOiJCaWNoYXJkIn0.TUh_742L3Rq9vJB4LzHfEDZUeYtxhAPCNLioY9GO2g4; sid=Fe26.2**2024593fd8909a4a3d387eec0cbf4315c4e7003acd4674a8a08887f71a998955*XchNIB6quVfbLjMDWgFqBA*_YsUHFJnThDGtjMmvmunNxR-qmeYG-nWA6fcHSATGRlh9saL8Y9kfjknUk3ot65Iy1RwLI5oyH19TALw_c-KH7Hgm5j2gW2KhTSbTwxmSyBBgsioO4i-RbyCKdU1yCE4QXZMRFUZkM6TiKa5v6cBObchuo6cHeLsPlbatrzMGDU86I4uliJq-y200flsR00sRe5ZyGbq_R8-9-LeFowWpsVypSN-Df9vEEidxKbDlSk**d442f8dc30a32b33776857a96f30ea5aee24013e9ecfb3d3feeed19beee2cd7d*w_baEE6E68fzbt8a0G7umxyGNke_niFuXu8piBhGay4"
      }
    }).then((response) => {
      expect(response.status).to.eq(401)
    })
  })
})
