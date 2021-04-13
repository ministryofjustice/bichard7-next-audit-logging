describe("Index Page", () => {
  context("720p resolution", () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
    })

    describe("When you visit home", () => {
      it("should visit the home page", () => {
        cy.visit("/")
        cy.get("h1").should("contain", "Bichard7 Audit Log Portal")
      })
      it("should show messages", () => {
        cy.get("h3").should("contain", "Messages")
        cy.get(".row")
          .should("have.length", 6)
          .first()
          .should("contain", "bda5a20f-e096-4373-8cde-04ac3155f145")
          .should("contain", "1000")
          .should("contain", "14/11/2021 00:00:00")
      })
    })
  })
})
