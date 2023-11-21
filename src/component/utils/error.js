import {Button, Container, Group, Text, Title} from "@mantine/core";
import classes from "../../styles/modules/ErrorPageTemplate.module.css"

// referenced: https://ui.mantine.dev/category/error-pages/
export const ErrorPageTemplate = ({
  code,
  title,
  description
}) => {
  return (
    <Container className={classes.root}>
      <div className={classes.label}>{code}</div>
      <Title className={classes.title}>{title}</Title>
      <Text c="dimmed" size="lg" ta="center" className={classes.description}>
        {description}
      </Text>
      <Group justify="center">
        <Button variant="subtle" size="md" component={"a"} href={"/"}>
          Take me back to home page
        </Button>
      </Group>
    </Container>
  )
}