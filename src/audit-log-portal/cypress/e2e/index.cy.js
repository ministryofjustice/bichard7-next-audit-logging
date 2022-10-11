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

      it("should show 10 messages", () => {
        cy.get(".MuiPaper-root")
          .should("have.length", 10)
          .first()
          .should("contain", "Message1")
          .should("contain", "14/11/2021 05:10:00")
      })
    })

    describe("When you search by external correlation ID", () => {
      it("Should show the associated message", () => {
        cy.visit("/")
        cy.get("input[type=text]").type("Message3")
        cy.get("button[type=submit]").click()
        cy.get(".MuiPaper-root")
          .should("have.length", 1)
          .first()
          .should("contain", "Message3")
          .should("contain", "13/11/2021 23:00:00")
      })
    })

    describe("When you search by message UUID", () => {
      it("Should show the associated message", () => {
        cy.visit("/")
        cy.get("input[type=text]").type("3079c4ff-d24a-45fc-92ec-852316940e40")
        cy.get("button[type=submit]").click()
        cy.get(".MuiPaper-root")
          .should("have.length", 1)
          .first()
          .should("contain", "Message6")
          .should("contain", "13/11/2021 17:12:00")
      })
    })
  })
})
