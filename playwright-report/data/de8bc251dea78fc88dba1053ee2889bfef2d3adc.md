# Page snapshot

```yaml
- generic [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e3]:
      - link "Contexta" [ref=e4] [cursor=pointer]:
        - /url: /
      - generic [ref=e5]:
        - link "Login" [ref=e6] [cursor=pointer]:
          - /url: /login
        - link "Start a Challenge" [ref=e7] [cursor=pointer]:
          - /url: /flow
        - button "Open menu" [ref=e9] [cursor=pointer]:
          - img [ref=e10]
          - img [ref=e12]
  - main [ref=e16]:
    - main [ref=e17]:
      - generic [ref=e18]:
        - heading "Welcome back" [level=1] [ref=e19]
        - generic [ref=e20]:
          - button "Sign up" [active] [ref=e21] [cursor=pointer]
          - button "Log in" [ref=e22] [cursor=pointer]
        - generic [ref=e23]:
          - button "Continue with Google" [ref=e24] [cursor=pointer]:
            - img [ref=e25]
            - text: Continue with Google
          - generic [ref=e32]: or
          - generic [ref=e34]:
            - textbox "Email" [ref=e35]
            - textbox "Password" [ref=e36]
            - button "Log in" [ref=e37] [cursor=pointer]
        - paragraph [ref=e38]:
          - text: No account yet?
          - button "Sign up" [ref=e39] [cursor=pointer]
```