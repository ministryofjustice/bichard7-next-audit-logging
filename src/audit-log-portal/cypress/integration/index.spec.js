describe("Index Page", () => {
  context("720p resolution", () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
    })

    describe("When you visit home", () => {
      it("should visit the home page", () => {
        cy.visit("/")
        cy.get("h1").should("contain", "Bichard7 Audit Log Portal - Messages")
      })

      it("should show Messages title", () => {
        cy.get("h4").should("contain", "Messages")
      })

      it("should show 7 messages", () => {
        cy.get(".MuiPaper-root")
          .should("have.length", 7)
          .first()
          .should("contain", "Message1")
          .should("contain", "14/11/2021 05:10:00")
      })
    })
  })
})
