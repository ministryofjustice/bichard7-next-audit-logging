describe("Index Page", () => {
  context("720p resolution", () => {
    beforeEach(() => {
      cy.viewport(1280, 720)
    })

    describe("When you visit home", () => {
      it("should visit the home page", () => {
        cy.visit("/")
      })

      describe("When you click the test button", () => {
        it("should navigate to the test page", () => {
          cy.get("a").contains("Show Test Page").click()

          cy.url().should("include", "/test")
        })
      })
    })
  })
})
